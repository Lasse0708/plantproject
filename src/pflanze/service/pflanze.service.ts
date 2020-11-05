/* eslint-disable max-lines */
import {
    ArtikelnummerExists,
    NameExists,
    PflanzeInvalid,
    PflanzeNotExists,
    PflanzeServiceError,
    VersionInvalid,
    VersionOutdated,
} from './errors';
import type { Document } from 'mongoose';
import type { Pflanze, PflanzeData } from '../entity';
import { PflanzenModel, validatePflanze } from '../entity';
import JSON5 from 'json5';
import { dbConfig, logger, mailConfig, serverConfig } from '../../shared';
import { PflanzeServiceMock } from './mock';
import type { SendMailOptions } from 'nodemailer';
import { startSession } from 'mongoose';

const { mockDB } = dbConfig;

// API-Dokumentation zu mongoose:
// http://mongoosejs.com/docs/api.html
// https://github.com/Automattic/mongoose/issues/3949

/* eslint-disable require-await, no-null/no-null, unicorn/no-useless-undefined */
// BEACHTE: asynchrone Funktionen in der Klasse erfordern kein top-level await
export class PflanzeService {
    private readonly mock: PflanzeServiceMock | undefined;

    constructor() {
        if (mockDB) {
            this.mock = new PflanzeServiceMock();
        }
    }

    // Status eines Promise:
    // Pending: das Resultat gibt es noch nicht, weil die asynchrone Operation,
    //          die das Resultat liefert, noch nicht abgeschlossen ist
    // Fulfilled: die asynchrone Operation ist abgeschlossen und
    //            das Promise-Objekt hat einen Wert
    // Rejected: die asynchrone Operation ist fehlgeschlagen and das
    //           Promise-Objekt wird nicht den Status "fulfilled" erreichen.
    //           Stattdessen ist im Promise-Objekt die Fehlerursache enthalten.

    async findById(id: string) {
        if (this.mock !== undefined) {
            return this.mock.findById(id);
        }
        logger.debug(`PflanzeService.findById(): id= ${id}`);

        // ein Pflanze zur gegebenen ID asynchron suchen
        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // null falls nicht gefunden
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
        // so dass der virtuelle getter "id" auch nicht mehr vorhanden ist
        const pflanze = await PflanzenModel.findById(id).lean<PflanzeData>();
        return pflanze ?? undefined;
    }

    async find(query?: any | undefined) {
        if (this.mock !== undefined) {
            return this.mock.find(query);
        }

        logger.debug(`PflanzeService.find(): query=${JSON5.stringify(query)}`);

        // alle Buecher asynchron suchen u. aufsteigend nach name sortieren
        // https://docs.mongodb.org/manual/reference/object-id
        // entries(): { name: 'a', rating: 5 } => [{ name: 'x'}, {rating: 5}]
        if (query === undefined || Object.entries(query).length === 0) {
            logger.debug('PflanzeService.find(): alle Buecher');
            // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
            return PflanzenModel.find().sort('name').lean<PflanzeData>();
        }

        // { name: 'a', rating: 5, javascript: true }
        const { name, javascript, typescript, ...dbQuery } = query; // eslint-disable-line @typescript-eslint/no-unsafe-assignment

        // Buecher zur Query (= JSON-Objekt durch Express) asynchron suchen
        if (name !== undefined) {
            // Name in der Query: Teilstring des Names,
            // d.h. "LIKE" als regulaerer Ausdruck
            // 'i': keine Unterscheidung zw. Gross- u. Kleinschreibung
            // NICHT /.../, weil das Muster variabel sein muss
            // CAVEAT: KEINE SEHR LANGEN Strings wg. regulaerem Ausdruck
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            if (name.length < 10) {
                dbQuery.name = new RegExp(name, 'iu'); // eslint-disable-line security/detect-non-literal-regexp
            }
        }

        // z.B. {javascript: true, typescript: true}
        const schlagwoerter = [];
        if (javascript === 'true') {
            schlagwoerter.push('JAVASCRIPT');
        }
        if (typescript === 'true') {
            schlagwoerter.push('TYPESCRIPT');
        }
        if (schlagwoerter.length === 0) {
            delete dbQuery.schlagwoerter;
        } else {
            dbQuery.schlagwoerter = schlagwoerter;
        }

        logger.debug(
            `PflanzeService.find(): dbQuery=${JSON5.stringify(dbQuery)}`,
        );

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // leeres Array, falls nichts gefunden wird
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
        return PflanzenModel.find(dbQuery).lean<PflanzeData>();
        // Pflanze.findOne(query), falls das Suchkriterium eindeutig ist
        // bei findOne(query) wird null zurueckgeliefert, falls nichts gefunden
    }

    async create(pflanzeData: Pflanze) {
        if (this.mock !== undefined) {
            return this.mock.create(pflanzeData);
        }

        logger.debug(
            `PflanzeService.create(): pflanzeData=${JSON5.stringify(
                pflanzeData,
            )}`,
        );
        const result = await this.validateCreate(pflanzeData);
        if (result instanceof PflanzeServiceError) {
            return result;
        }

        const pflanze = new PflanzenModel(pflanzeData);
        let pflanzeSaved!: Document;
        // https://www.mongodb.com/blog/post/quick-start-nodejs--mongodb--how-to-implement-transactions
        const session = await startSession();
        try {
            await session.withTransaction(async () => {
                pflanzeSaved = await pflanze.save();
            });
        } catch (err: unknown) {
            logger.error(
                `PflanzeService.create(): Die Transaktion wurde abgebrochen: ${JSON5.stringify(
                    err,
                )}`,
            );
            // TODO [2030-09-30] Weitere Fehlerbehandlung bei Rollback
        } finally {
            session.endSession();
        }
        const pflanzeDataSaved: PflanzeData = pflanzeSaved.toObject(); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        logger.debug(
            `PflanzeService.create(): pflanzeDataSaved=${JSON5.stringify(
                pflanzeDataSaved,
            )}`,
        );

        await this.sendmail(pflanzeDataSaved);

        return pflanzeDataSaved;
    }

    async update(pflanzeData: Pflanze, versionStr: string) {
        if (this.mock !== undefined) {
            return this.mock.update(pflanzeData);
        }

        logger.debug(
            `PflanzeService.update(): pflanzeData=${JSON5.stringify(
                pflanzeData,
            )}`,
        );
        logger.debug(`PflanzeService.update(): versionStr=${versionStr}`);

        const validateResult = await this.validateUpdate(
            pflanzeData,
            versionStr,
        );
        if (validateResult instanceof PflanzeServiceError) {
            return validateResult;
        }

        // findByIdAndReplace ersetzt ein Document mit ggf. weniger Properties
        const pflanze = new PflanzenModel(pflanzeData);
        const updateOptions = { new: true };
        const result = await PflanzenModel.findByIdAndUpdate(
            pflanze._id,
            pflanze,
            updateOptions,
        ).lean<PflanzeData>();
        if (result === null) {
            return new PflanzeNotExists(pflanze._id);
        }

        if (result.__v !== undefined) {
            result.__v++;
        }
        logger.debug(
            `PflanzeService.update(): result=${JSON5.stringify(result)}`,
        );

        // Weitere Methoden von mongoose zum Aktualisieren:
        //    Pflanze.findOneAndUpdate(update)
        //    pflanze.update(bedingung)
        return Promise.resolve(result);
    }

    async delete(id: string) {
        if (this.mock !== undefined) {
            return this.mock.remove(id);
        }
        logger.debug(`PflanzeService.delete(): id=${id}`);

        // Das Pflanze zur gegebenen ID asynchron loeschen
        const { deletedCount } = await PflanzenModel.deleteOne({ _id: id }); // eslint-disable-line @typescript-eslint/naming-convention
        logger.debug(`PflanzeService.delete(): deletedCount=${deletedCount}`);
        return deletedCount !== undefined;

        // Weitere Methoden von mongoose, um zu loeschen:
        //  Pflanze.findByIdAndRemove(id)
        //  Pflanze.findOneAndRemove(bedingung)
    }

    private async validateCreate(pflanze: Pflanze) {
        const msg = validatePflanze(pflanze);
        if (msg !== undefined) {
            logger.debug(
                `PflanzeService.validateCreate(): Validation Message: ${JSON5.stringify(
                    msg,
                )}`,
            );
            return new PflanzeInvalid(msg);
        }

        // statt 2 sequentiellen DB-Zugriffen waere 1 DB-Zugriff mit OR besser

        const resultName = await this.checkNameExists(pflanze);
        if (resultName !== undefined) {
            return resultName;
        }

        const resultArtikelnummer = await this.checkArtikelnummerExists(
            pflanze,
        );
        if (resultArtikelnummer !== undefined) {
            return resultArtikelnummer;
        }

        logger.debug('PflanzeService.validateCreate(): ok');
        return undefined;
    }

    private async checkNameExists(pflanze: Pflanze) {
        const { name } = pflanze;

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const tmpId = await PflanzenModel.findOne({ name }, { _id: true }).lean<
            string
        >();
        if (tmpId !== null) {
            logger.debug(
                `PflanzeService.checkNameExists(): _id=${JSON5.stringify(
                    tmpId,
                )}`,
            );
            return new NameExists(name as string, tmpId);
        }

        logger.debug('PflanzeService.checkNameExists(): ok');
        return undefined;
    }

    private async checkArtikelnummerExists(pflanze: Pflanze) {
        const { artikelnummer } = pflanze;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const tmpId = await PflanzenModel.findOne(
            { artikelnummer },
            { _id: true },
        ).lean<string>();

        if (tmpId !== null) {
            logger.debug(
                `PflanzeService.checkArtikelnummerExists(): pflanze=${JSON5.stringify(
                    tmpId,
                )}`,
            );
            return new ArtikelnummerExists(artikelnummer as string, tmpId);
        }

        logger.debug('PflanzeService.checkArtikelnummerExists(): ok');
        return undefined;
    }

    private async sendmail(pflanzeData: PflanzeData) {
        if (serverConfig.cloud !== undefined) {
            // In der Cloud kann man z.B. "@sendgrid/mail" statt
            // "nodemailer" mit lokalem Mailserver verwenden
            return;
        }

        const from = '"Joe Doe" <Joe.Doe@acme.com>';
        const to = '"Foo Bar" <Foo.Bar@acme.com>';
        const subject = `Neues Pflanze ${pflanzeData._id}`;
        const body = `Das Pflanze mit dem Name <strong>${pflanzeData.name}</strong> ist angelegt`;

        const data: SendMailOptions = { from, to, subject, html: body };
        logger.debug(`sendMail(): data = ${JSON5.stringify(data)}`);

        try {
            const nodemailer = await import('nodemailer'); // eslint-disable-line node/no-unsupported-features/es-syntax
            await nodemailer.createTransport(mailConfig).sendMail(data);
        } catch (err: unknown) {
            logger.error(
                `PflanzeService.create(): Fehler beim Verschicken der Email: ${JSON5.stringify(
                    err,
                )}`,
            );
        }
    }

    private async validateUpdate(pflanze: PflanzeData, versionStr: string) {
        const result = this.validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        logger.debug(`PflanzeService.validateUpdate(): version=${version}`);
        logger.debug(
            `PflanzeService.validateUpdate(): pflanze=${JSON5.stringify(
                pflanze,
            )}`,
        );

        const validationMsg = validatePflanze(pflanze);
        if (validationMsg !== undefined) {
            return new PflanzeInvalid(validationMsg);
        }

        const resultName = await this.checkNameExists(pflanze);
        if (resultName !== undefined && resultName.id !== pflanze._id) {
            return resultName;
        }

        const resultIdAndVersion = await this.checkIdAndVersion(
            pflanze._id,
            version,
        );
        if (resultIdAndVersion !== undefined) {
            return resultIdAndVersion;
        }

        logger.debug('PflanzeService.validateUpdate(): ok');
        return undefined;
    }

    private validateVersion(versionStr: string | undefined) {
        if (versionStr === undefined) {
            const error = new VersionInvalid(versionStr);
            logger.debug(
                `PflanzeService.validateVersion(): VersionInvalid=${JSON5.stringify(
                    error,
                )}`,
            );
            return error;
        }

        const version = Number.parseInt(versionStr, 10);
        if (Number.isNaN(version)) {
            const error = new VersionInvalid(versionStr);
            logger.debug(
                `PflanzeService.validateVersion(): VersionInvalid=${JSON5.stringify(
                    error,
                )}`,
            );
            return error;
        }

        return version;
    }

    private async checkIdAndVersion(id: string | undefined, version: number) {
        const pflanzeDb = await PflanzenModel.findById(id).lean<PflanzeData>();
        if (pflanzeDb === null) {
            const result = new PflanzeNotExists(id);
            logger.debug(
                `PflanzeService.checkIdAndVersion(): PflanzeNotExists=${JSON5.stringify(
                    result,
                )}`,
            );
            return result;
        }

        const versionDb = pflanzeDb.__v ?? 0;
        if (version < versionDb) {
            const result = new VersionOutdated(id as string, version);
            logger.debug(
                `PflanzeService.checkIdAndVersion(): VersionOutdated=${JSON5.stringify(
                    result,
                )}`,
            );
            return result;
        }

        return undefined;
    }
}
/* eslint-enable require-await, no-null/no-null, unicorn/no-useless-undefined */
/* eslint-enable max-lines */
