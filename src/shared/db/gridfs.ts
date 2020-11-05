import type {
    GridFSBucket,
    GridFSBucketOpenUploadStreamOptions,
    GridFSBucketWriteStream,
    MongoClient,
} from 'mongodb';
import type { Readable } from 'stream';
import { closeMongoDBClient } from './mongoDB';
import { logger } from '../../shared/logger';

/* eslint-disable max-params */
export const saveReadable = (
    readable: Readable,
    bucket: GridFSBucket,
    filename: string,
    metadata: GridFSBucketOpenUploadStreamOptions,
    client: MongoClient,
): GridFSBucketWriteStream =>
    readable
        .pipe(bucket.openUploadStream(filename, metadata))
        .on('finish', () => {
            logger.debug('gridfs.saveReadable(): UploadStream ist beendet');
            closeMongoDBClient(client);
        });
/* eslint-enable max-params */
