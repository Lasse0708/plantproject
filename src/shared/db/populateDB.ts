import type { Collection, Db, MongoClient } from 'mongodb';
import { dbConfig, serverConfig } from './../config';
import { GridFSBucket } from 'mongodb';
import { pflanzen } from './pflanzen';
import { connectMongoDB } from './mongoDB';
import { createReadStream } from 'fs';
import { logger } from '../logger';
import { resolve } from 'path';
import { saveReadable } from './gridfs';

const createCollection = async (db: Db) => {
    // http://mongodb.github.io/node-mongodb-native/3.5/api/Db.html#dropCollection
    const collectionName = 'Pflanzen';
    logger.warn(`Die Collection "${collectionName}" wird geloescht...`);
    let dropped = false;
    try {
        dropped = await db.dropCollection(collectionName);
    } catch (err: any) {
        // Falls der Error *NICHT* durch eine fehlende Collection verursacht wurde
        if (err.name !== 'MongoError') {
            logger.error(`Fehler beim Neuladen der DB ${db.databaseName}`);
            return;
        }
    }
    if (dropped) {
        logger.warn(`Die Collection "${collectionName}" wurde geloescht.`);
    }

    // http://mongodb.github.io/node-mongodb-native/3.5/api/Db.html#createCollection
    logger.warn(`Die Collection "${collectionName}" wird neu angelegt...`);
    const collection = await db.createCollection(collectionName);
    logger.warn(
        `Die Collection "${collection.collectionName}" wurde neu angelegt.`,
    );

    // http://mongodb.github.io/node-mongodb-native/3.5/api/Collection.html#insertMany
    const result = await collection.insertMany(pflanzen);
    logger.warn(`${result.insertedCount} Datensaetze wurden eingefuegt.`);

    return collection;
};

const createIndex = async (collection: Collection) => {
    logger.warn(
        `Indexe fuer "${collection.collectionName}" werden neu angelegt...`,
    );

    // http://mongodb.github.io/node-mongodb-native/3.5/api/Collection.html#createIndex
    // Beachte: bei createIndexes() gelten die Optionen fuer alle Indexe
    
    let index = await collection.createIndex('titel', { unique: false });
    logger.warn(`Der Index ${index} wurde angelegt.`);
    index = await collection.createIndex('isbn', { unique: false });
    logger.warn(`Der Index ${index} wurde angelegt.`);
    index = await collection.createIndex('schlagwoerter', { sparse: true });
    logger.warn(`Der Index ${index} wurde angelegt.`);
};

const uploadBinary = (db: Db, client: MongoClient) => {
    // Kein File-Upload in die Cloud
    if (serverConfig.cloud !== undefined) {
        logger.info('uploadBinary(): Keine Binaerdateien mit der Cloud');
        return;
    }

    const filenameBinary = 'image.png';
    const contentType = 'image/png';

    const filename = '00000000-0000-0000-0000-000000000001';
    logger.warn(`uploadBinary(): "${filename}" wird eingelesen.`);

    // https://mongodb.github.io/node-mongodb-native/3.5/tutorials/gridfs/streaming
    const bucket = new GridFSBucket(db);
    bucket.drop();

    /* global __dirname */
    const readable = createReadStream(resolve(__dirname, filenameBinary));
    const metadata = { contentType };
    saveReadable(readable, bucket, filename, { metadata }, client);
};

export const populateDB = async (dev?: boolean) => {
    let devMode = dev;
    if (devMode === undefined) {
        devMode = dbConfig.dbPopulate;
    }
    logger.info(`populateDB(): devMode=${devMode}`);

    if (!devMode) {
        return;
    }

    const { db, client } = await connectMongoDB();

    const collection = await createCollection(db);
    if (collection === undefined) {
        return;
    }

    await createIndex(collection);

    uploadBinary(db, client);
};
