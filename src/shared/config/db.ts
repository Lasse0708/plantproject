import JSON5 from 'json5';
import { resolve } from 'path';
import { serverConfig } from './server';

console.assert(serverConfig.host);

// -----------------------------------------------------------------------------
// D e f a u l t w e r t e
// -----------------------------------------------------------------------------
const replicaSet = 'replicaSet';

// -----------------------------------------------------------------------------
// U m g e b u n g s v a r i a b l e
// -----------------------------------------------------------------------------
const {
    DB_NAME,
    DB_HOST,
    DB_USER,
    DB_PASS,
    DB_TLS,
    DB_POPULATE,
    MOCK_DB,
} = process.env; // eslint-disable-line node/no-process-env

// -----------------------------------------------------------------------------
// E i n s t e l l u n g e n
// -----------------------------------------------------------------------------
const dbName = DB_NAME ?? 'acme';
const atlas = DB_HOST?.endsWith('mongodb.net') ?? false;
const host = DB_HOST ?? 'cluster0.8j9ph.mongodb.net';
const port = 27017;
const user = DB_USER ?? 'Lasse';
const pass = DB_PASS ?? 'G1bson123';
const tls = DB_TLS === undefined || DB_TLS === 'true' || DB_TLS === 'TRUE';
const dbPopulate = DB_POPULATE !== undefined;

let url: string;
let adminUrl: string;

if (atlas) {
    // https://docs.mongodb.com/manual/reference/connection-string
    // Default:
    //  retryWrites=true            ab MongoDB-Treiber 4.2
    //  readPreference=primary
    // "mongodb+srv://" statt "mongodb://" fuer eine "DNS seedlist" z.B. bei "Replica Set"
    // https://docs.mongodb.com/manual/reference/write-concern
    url = `mongodb+srv://${user}:${pass}@${host}/${dbName}?retryWrites=true&w=majority`;
    // url = `mongodb+srv://${user}:${pass}@${host}/${dbName}?replicaSet=Cluster0-shard-0&w=majority`;
    adminUrl = `mongodb+srv://${user}:${pass}@${host}/admin?w=majority`;
} else {
    url = `mongodb://${user}:${pass}@${host}/${dbName}?replicaSet=${replicaSet}&authSource=admin`;
    adminUrl = `mongodb://${user}:${pass}@${host}/admin`;
}

const mockDB = MOCK_DB === 'true';

export const dbConfig = {
    atlas,
    url,
    adminUrl,
    dbName,
    host,
    port,
    user,
    pass,
    tls,
    tlsCertificateKeyFile:
        atlas || !tls
            ? undefined
            : resolve(
                  'C:\\',
                  'Zimmermann',
                  'volumes',
                  'mongodb-replicaset-4.2',
                  'tls',
                  'key.pem',
              ),
    dbPopulate,
    mockDB,
};

const dbConfigLog = {
    atlas,
    url: url.replace(/\/\/.*:/u, '//USERNAME:@').replace(/:[^:]*@/u, ':***@'),
    adminUrl: adminUrl
        .replace(/\/\/.*:/u, '//USERNAME:@')
        .replace(/:[^:]*@/u, ':***@'),
    dbName,
    host,
    port,
    tls,
    dbPopulate,
    mockDB,
};

console.info(`dbConfig: ${JSON5.stringify(dbConfigLog)}`);
