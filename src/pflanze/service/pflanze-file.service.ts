import { FileNotFound, MultipleFiles, PflanzeNotExists } from './errors';
import { GridFSBucket } from 'mongodb';
import { closeMongoDBClient, connectMongoDB, saveReadable } from '../../shared';
import JSON5 from 'json5';
import { PflanzenModel } from '../entity';
import type { ObjectId } from 'mongodb';
import { Readable } from 'stream';
import { logger } from '../../shared';

/* eslint-disable unicorn/no-useless-undefined */
export class PflanzeFileService {
    async save(id: string, buffer: Buffer, contentType: string | undefined) {
        logger.debug(
            `PflanzeFileService.save(): id = ${id}, contentType=${contentType}`,
        );

        // Gibt es ein Pflanze zur angegebenen ID?
        const pflanze = await PflanzenModel.findById(id);
        // eslint-disable-next-line no-null/no-null
        if (pflanze === null) {
            return false;
        }

        const { db, client } = await connectMongoDB();
        const bucket = new GridFSBucket(db);
        await this.deleteFiles(id, bucket);

        // https://stackoverflow.com/questions/13230487/converting-a-buffer-into-a-readablestream-in-node-js#answer-44091532
        const readable = new Readable();
        // _read ist erforderlich, kann die leere Funktion sein
        readable._read = () => {}; // eslint-disable-line no-underscore-dangle,no-empty-function
        readable.push(buffer);
        readable.push(null); // eslint-disable-line no-null/no-null,unicorn/no-null

        const metadata = { contentType };
        saveReadable(readable, bucket, id, { metadata }, client);
        return true;
    }

    async find(filename: string) {
        logger.debug(`PflanzeFileService.findFile(): filename=${filename}`);
        const resultCheck = await this.checkFilename(filename);
        if (resultCheck !== undefined) {
            return resultCheck;
        }

        const { db, client } = await connectMongoDB();

        // https://mongodb.github.io/node-mongodb-native/3.5/tutorials/gridfs/streaming
        const bucket = new GridFSBucket(db);
        const resultContentType = await this.getContentType(filename, bucket);
        if (typeof resultContentType !== 'string') {
            return resultContentType;
        }

        const contentType = resultContentType;
        // https://mongodb.github.io/node-mongodb-native/3.5/tutorials/gridfs/streaming/#downloading-a-file
        // https://www.freecodecamp.org/news/node-js-streams-everything-you-need-to-know-c9141306be93
        const readStream = bucket
            .openDownloadStreamByName(filename)
            .on('end', () => closeMongoDBClient(client));
        return { readStream, contentType };
    }

    private async deleteFiles(filename: string, bucket: GridFSBucket) {
        logger.debug(`PflanzeFileService.deleteFiles(): filename=${filename}`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/naming-convention
        const idObjects: { _id: ObjectId }[] = await bucket
            .find({ filename })
            .project({ _id: 1 }) // eslint-disable-line @typescript-eslint/naming-convention
            .toArray();
        const ids = idObjects.map((obj) => obj._id);
        logger.debug(
            `PflanzeFileService.deleteFiles(): ids=${JSON5.stringify(ids)}`,
        );
        ids.forEach((fileId) =>
            bucket.delete(fileId, () =>
                logger.debug(
                    `PflanzeFileService.deleteFiles(): geloeschte ID=${JSON5.stringify(
                        fileId,
                    )}`,
                ),
            ),
        );
    }

    private async checkFilename(filename: string) {
        logger.debug(
            `PflanzeFileService.checkFilename(): filename=${filename}`,
        );

        // Gibt es ein Pflanze mit dem gegebenen "filename" als ID?
        const pflanze = await PflanzenModel.findById(filename);
        // eslint-disable-next-line no-null/no-null
        if (pflanze === null) {
            const result = new PflanzeNotExists(filename);
            logger.debug(
                `PflanzeFileService.checkFilename(): PflanzeNotExists=${JSON5.stringify(
                    result,
                )}`,
            );
            return result;
        }

        logger.debug(
            `PflanzeFileService.checkFilename(): pflanze=${JSON5.stringify(
                pflanze,
            )}`,
        );

        return undefined;
    }

    private async getContentType(filename: string, bucket: GridFSBucket) {
        let files: { metadata: { contentType: string } }[];
        try {
            files = await bucket.find({ filename }).toArray(); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        } catch (err: unknown) {
            logger.error(`${JSON5.stringify(err)}`);
            files = [];
        }

        switch (files.length) {
            case 0: {
                const error = new FileNotFound(filename);
                logger.debug(
                    `PflanzeFileService.getContentType(): FileNotFound=${JSON5.stringify(
                        error,
                    )}`,
                );
                return error;
            }

            case 1: {
                const [file] = files;
                const { contentType }: { contentType: string } = file.metadata;
                logger.debug(
                    `PflanzeFileService.getContentType(): contentType=${contentType}`,
                );
                return contentType;
            }

            default: {
                const error = new MultipleFiles(filename);
                logger.debug(
                    `PflanzeFileService.getContentType(): MultipleFiles=${JSON5.stringify(
                        error,
                    )}`,
                );
                return new MultipleFiles(filename);
            }
        }
    }
}

/* eslint-enable unicorn/no-useless-undefined */
