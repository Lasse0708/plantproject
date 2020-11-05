/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import {
    ArtikelnummerExists,
    NameExists,
    PflanzeInvalid,
    PflanzeNotExists,
    PflanzeService,
    PflanzeServiceError,
    VersionInvalid,
    VersionOutdated,
} from '../service';
import type { CreateError, UpdateError } from '../service';
import { HttpStatus, getBaseUri, logger, mimeConfig } from '../../shared';
import type { PflanzeData, ValidationErrorMsg } from '../entity';
import type { Request, Response } from 'express';
import JSON5 from 'json5';

// export bei async und await:
// https://blogs.msdn.microsoft.com/typescript/2015/11/30/announcing-typescript-1-7
// http://tc39.github.io/ecmascript-export
// https://nemethgergely.com/async-function-best-practices#Using-async-functions-with-express

export class PflanzeRequestHandler {
    // Dependency Injection ggf. durch
    // * Awilix https://github.com/jeffijoe/awilix
    // * InversifyJS https://github.com/inversify/InversifyJS
    // * Node Dependency Injection https://github.com/zazoomauro/node-dependency-injection
    // * BottleJS https://github.com/young-steveo/bottlejs
    private readonly service = new PflanzeService();

    // vgl Kotlin: Schluesselwort "suspend"
    // eslint-disable-next-line max-statements
    async findById(req: Request, res: Response) {
        const versionHeader = req.header('If-None-Match');
        logger.debug(
            `PflanzeRequestHandler.findById(): versionHeader=${versionHeader}`,
        );
        const { id } = req.params;
        logger.debug(`PflanzeRequestHandler.findById(): id=${id}`);

        let pflanze: PflanzeData | undefined;
        try {
            // vgl. Kotlin: Aufruf einer suspend-Function
            pflanze = await this.service.findById(id);
        } catch (err: unknown) {
            // Exception einer export async function bei der Ausfuehrung fangen:
            // https://strongloop.com/strongblog/comparing-node-js-promises-trycatch-zone-js-angular
            logger.error(
                `PflanzeRequestHandler.findById(): error=${JSON5.stringify(
                    err,
                )}`,
            );
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        if (pflanze === undefined) {
            logger.debug('PflanzeRequestHandler.findById(): status=NOT_FOUND');
            res.sendStatus(HttpStatus.NOT_FOUND);
            return;
        }

        logger.debug(
            `PflanzeRequestHandler.findById(): pflanze=${JSON5.stringify(
                pflanze,
            )}`,
        );
        const versionDb = pflanze.__v;
        if (versionHeader === `"${versionDb}"`) {
            res.sendStatus(HttpStatus.NOT_MODIFIED);
            return;
        }
        logger.debug(
            `PflanzeRequestHandler.findById(): VersionDb=${versionDb}`,
        );
        res.header('ETag', `"${versionDb}"`);

        const baseUri = getBaseUri(req);
        // HATEOAS: Atom Links
        // eslint-disable-next-line no-underscore-dangle
        pflanze._links = {
            self: { href: `${baseUri}/${id}` },
            list: { href: `${baseUri}` },
            add: { href: `${baseUri}` },
            update: { href: `${baseUri}/${id}` },
            remove: { href: `${baseUri}/${id}` },
        };

        delete pflanze._id;
        delete pflanze.__v;
        delete pflanze.createdAt;
        delete pflanze.updatedAt;
        res.json(pflanze);
    }

    async find(req: Request, res: Response) {
        // z.B. https://.../pflanzen?name=Alpha
        // => req.query = { name: "Alpha' }
        const { query } = req;
        logger.debug(
            `PflanzeRequestHandler.find(): queryParams=${JSON5.stringify(
                query,
            )}`,
        );

        let pflanzen: PflanzeData[];
        try {
            pflanzen = await this.service.find(query);
        } catch (err: unknown) {
            logger.error(
                `PflanzeRequestHandler.find(): error=${JSON5.stringify(err)}`,
            );
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        logger.debug(
            `PflanzeRequestHandler.find(): pflanzen=${JSON5.stringify(
                pflanzen,
            )}`,
        );
        if (pflanzen.length === 0) {
            // Alternative: https://www.npmjs.com/package/http-errors
            // Damit wird aber auch der Stacktrace zum Client
            // uebertragen, weil das resultierende Fehlerobjekt
            // von Error abgeleitet ist.
            logger.debug('PflanzeRequestHandler.find(): status = NOT_FOUND');
            res.sendStatus(HttpStatus.NOT_FOUND);
            return;
        }

        const baseUri = getBaseUri(req);

        // asynchrone for-of Schleife statt synchrones pflanzen.map()
        for await (const pflanze of pflanzen) {
            // HATEOAS: Atom Links je Pflanze
            // eslint-disable-next-line no-underscore-dangle
            pflanze._links = { self: { href: `${baseUri}/${pflanze._id}` } };
        }

        logger.debug(
            `PflanzeRequestHandler.find(): pflanzen=${JSON5.stringify(
                pflanzen,
            )}`,
        );
        pflanzen.forEach((pflanze) => {
            delete pflanze._id;
            delete pflanze.__v;
            delete pflanze.createdAt;
            delete pflanze.updatedAt;
        });
        res.json(pflanzen);
    }

    async create(req: Request, res: Response) {
        const contentType = req.header(mimeConfig.contentType);
        if (
            // Optional Chaining
            contentType?.toLowerCase() !== mimeConfig.json
        ) {
            logger.debug(
                'PflanzeRequestHandler.create() status=NOT_ACCEPTABLE',
            );
            res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
            return;
        }

        const pflanzeData = req.body; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        logger.debug(
            `PflanzeRequestHandler.create(): body=${JSON5.stringify(
                pflanzeData,
            )}`,
        );

        const result = await this.service.create(pflanzeData);
        if (result instanceof PflanzeServiceError) {
            this.handleCreateError(result, res);
            return;
        }

        const pflanzeSaved = result;
        const location = `${getBaseUri(req)}/${pflanzeSaved._id}`;
        logger.debug(`PflanzeRequestHandler.create(): location=${location}`);
        res.location(location);
        res.sendStatus(HttpStatus.CREATED);
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug(`PflanzeRequestHandler.update(): id=${id}`);

        const contentType = req.header(mimeConfig.contentType);
        if (contentType?.toLowerCase() !== mimeConfig.json) {
            res.status(HttpStatus.NOT_ACCEPTABLE);
            return;
        }
        const version = this.getVersionHeader(req, res);
        if (version === undefined) {
            return;
        }

        const pflanzeData = req.body; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        pflanzeData._id = id;
        logger.debug(
            `PflanzeRequestHandler.update(): pflanze=${JSON5.stringify(
                pflanzeData,
            )}`,
        );

        const result = await this.service.update(pflanzeData, version);
        if (result instanceof PflanzeServiceError) {
            this.handleUpdateError(result, res);
            return;
        }

        logger.debug(
            `PflanzeRequestHandler.update(): result=${JSON5.stringify(result)}`,
        );
        const neueVersion = `"${result.__v?.toString()}"`;
        res.set('ETag', neueVersion);
        res.sendStatus(HttpStatus.NO_CONTENT);
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug(`PflanzeRequestHandler.delete(): id=${id}`);

        try {
            await this.service.delete(id);
        } catch (err: unknown) {
            logger.error(
                `PflanzeRequestHandler.delete(): error=${JSON5.stringify(err)}`,
            );
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        logger.debug('PflanzeRequestHandler.delete(): NO_CONTENT');
        res.sendStatus(HttpStatus.NO_CONTENT);
    }

    private handleCreateError(err: CreateError, res: Response) {
        if (err instanceof PflanzeInvalid) {
            this.handleValidationError(err.msg, res);
            return;
        }

        if (err instanceof NameExists) {
            this.handleNameExists(err.name, err.id, res);
            return;
        }

        if (err instanceof ArtikelnummerExists) {
            this.handleArtikelnummerExists(err.artikelnummer, err.id, res);
        }
    }

    private handleArtikelnummerExists(
        artikelnummer: string,
        id: string,
        res: Response,
    ) {
        const msg = `Die Artikelnummer "${artikelnummer}" existiert bereits bei ${id}.`;
        logger.debug(`PflanzeRequestHandler.handleCreateError(): msg=${msg}`);
        res.status(HttpStatus.BAD_REQUEST)
            .set('Content-Type', 'text/plain')
            .send(msg);
    }

    private handleValidationError(msg: ValidationErrorMsg, res: Response) {
        logger.debug(
            `PflanzeRequestHandler.handleCreateError(): msg=${JSON.stringify(
                msg,
            )}`,
        );
        res.status(HttpStatus.BAD_REQUEST).send(msg);
    }

    private handleNameExists(name: string, id: string, res: Response) {
        const msg = `Der Name "${name}" existiert bereits bei ${id}.`;
        logger.debug(`PflanzeRequestHandler.handleCreateError(): msg=${msg}`);
        res.status(HttpStatus.BAD_REQUEST)
            .set('Content-Type', 'text/plain')
            .send(msg);
    }

    private getVersionHeader(req: Request, res: Response) {
        const versionHeader = req.header('If-Match');
        logger.debug(
            `PflanzeRequestHandler.getVersionHeader() versionHeader=${versionHeader}`,
        );

        if (versionHeader === undefined) {
            const msg = 'Versionsnummer fehlt';
            logger.debug(
                `PflanzeRequestHandler.getVersionHeader(): status=428, message=${msg}`,
            );
            res.status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        const { length } = versionHeader;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (length < 3) {
            const msg = `Ungueltige Versionsnummer: ${versionHeader}`;
            logger.debug(
                `PflanzeRequestHandler.getVersionHeader(): status=412, message=${msg}`,
            );
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        // slice: einschl. Start, ausschl. Ende
        const version = versionHeader.slice(1, -1);
        logger.debug(
            `PflanzeRequestHandler.getVersionHeader(): version=${version}`,
        );
        return version;
    }

    private handleUpdateError(err: UpdateError, res: Response) {
        if (err instanceof PflanzeInvalid) {
            this.handleValidationError(err.msg, res);
            return;
        }

        if (err instanceof PflanzeNotExists) {
            const { id } = err;
            const msg = `Es gibt keine Pflanze mit der ID "${id}".`;
            logger.debug(
                `PflanzeRequestHandler.handleUpdateError(): msg=${msg}`,
            );
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        if (err instanceof NameExists) {
            this.handleNameExists(err.name, err.id, res);
            return;
        }

        if (err instanceof VersionInvalid) {
            const { version } = err;
            const msg = `Die Versionsnummer "${version}" ist ungueltig.`;
            logger.debug(
                `PflanzeRequestHandler.handleUpdateError(): msg=${msg}`,
            );
            res.status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        if (err instanceof VersionOutdated) {
            const { version } = err;
            const msg = `Die Versionsnummer "${version}" ist nicht aktuell.`;
            logger.debug(
                `PflanzeRequestHandler.handleUpdateError(): msg=${msg}`,
            );
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
        }
    }
}

/* eslint-enable max-lines */
