import {
    FileNotFound,
    MultipleFiles,
    PflanzeFileService,
    PflanzeFileServiceError,
    PflanzeNotExists,
} from '../service';
import { HttpStatus, logger } from '../../shared';
import type { Request, Response } from 'express';
import type { DownloadError } from '../service';
import JSON5 from 'json5';

// export bei async und await:
// https://blogs.msdn.microsoft.com/typescript/2015/11/30/announcing-typescript-1-7
// http://tc39.github.io/ecmascript-export
// https://nemethgergely.com/async-function-best-practices#Using-async-functions-with-express

export class PflanzeFileRequestHandler {
    private readonly service = new PflanzeFileService();

    upload(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug(`PflanzeFileRequestHandler.uploadBinary(): id=${id}`);

        // https://jsao.io/2019/06/uploading-and-downloading-files-buffering-in-node-js

        const data: Uint8Array[] = [];
        let totalBytesInBuffer = 0;

        // Wenn body-parser verwendet wird (z.B. bei textuellen JSON-Daten),
        // dann verarbeitet body-parser die Events "data" und "end".
        // https://nodejs.org/api/http.html#http_class_http_clientrequest

        req.on('data', (chunk: Uint8Array) => {
            const { length } = chunk;
            logger.debug(
                `PflanzeFileRequestHandler.uploadBinary(): data ${length}`,
            );
            data.push(chunk);
            totalBytesInBuffer += length;
        })
            .on('aborted', () =>
                logger.debug(
                    'PflanzeFileRequestHandler.uploadBinary(): aborted',
                ),
            )
            .on('end', () => {
                logger.debug(
                    `PflanzeFileRequestHandler.uploadBinary(): end ${totalBytesInBuffer}`,
                );
                const buffer = Buffer.concat(data, totalBytesInBuffer);

                // IIFE (= Immediately Invoked Function Expression) wegen await
                // https://developer.mozilla.org/en-US/docs/Glossary/IIFE
                // https://github.com/typescript-eslint/typescript-eslint/issues/647
                // https://github.com/typescript-eslint/typescript-eslint/pull/1799
                (async () => {
                    try {
                        await this.save(req, id, buffer);
                    } catch (err: unknown) {
                        logger.error(
                            `Fehler beim Abspeichern: ${JSON5.stringify(err)}`,
                        );
                        return;
                    }

                    res.sendStatus(HttpStatus.NO_CONTENT);
                })();
            });
    }

    async download(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug(`PflanzeFileRequestHandler.downloadBinary(): ${id}`);
        if ((id as string | undefined) === undefined) {
            res.status(HttpStatus.BAD_REQUEST).send('Keine Pflanze-Id');
            return;
        }

        const findResult = await this.service.find(id);
        if (
            findResult instanceof PflanzeFileServiceError ||
            findResult instanceof PflanzeNotExists
        ) {
            this.handleDownloadError(findResult, res);
            return;
        }

        const file = findResult;
        const { readStream, contentType } = file;
        res.contentType(contentType);
        // https://www.freecodecamp.org/news/node-js-streams-everything-you-need-to-know-c9141306be93
        readStream.pipe(res);
    }

    private async save(req: Request, id: string, buffer: Buffer) {
        const contentType = req.headers['content-type'];
        await this.service.save(id, buffer, contentType);
    }

    private handleDownloadError(
        err: PflanzeNotExists | DownloadError,
        res: Response,
    ) {
        if (err instanceof PflanzeNotExists) {
            const { id } = err;
            const msg = `Es gibt keine Pflanze mit der ID "${id}".`;
            logger.debug(
                `PflanzeFileRequestHandler.handleDownloadError(): msg=${msg}`,
            );
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        if (err instanceof FileNotFound) {
            const { filename } = err;
            const msg = `Es gibt kein File mit Name ${filename}`;
            logger.debug(
                `PflanzeFileRequestHandler.handleDownloadError(): msg=${msg}`,
            );
            res.status(HttpStatus.NOT_FOUND).send(msg);
            return;
        }

        if (err instanceof MultipleFiles) {
            const { filename } = err;
            const msg = `Es gibt mehr als ein File mit Name ${filename}`;
            logger.debug(
                `PflanzeFileRequestHandler.handleDownloadError(): msg=${msg}`,
            );
            res.status(HttpStatus.INTERNAL_ERROR).send(msg);
        }
    }
}
