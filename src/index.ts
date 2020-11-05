// https://github.com/i0natan/nodebestpractices

// Stacktraces mit Beruecksichtigung der TypeScript-Dateien
import 'source-map-support/register';

import { connectDB, logger, populateDB, serverConfig } from './shared';
import { release, type } from 'os';
import type { Application } from 'express';
import JSON5 from 'json5';
// "type-only import" ab TypeScript 3.8
import type { RequestListener } from 'http';
import type { SecureContextOptions } from 'tls';
import type { Server } from 'net';
import { app } from './app';
import { connection } from 'mongoose';
import { createServer } from 'https';
import ip from 'ip';
import stripIndent from 'strip-indent';

/* eslint-disable no-process-exit */
// Arrow Function
const disconnectDB = () => {
    connection.close().catch(() => process.exit(0)); // eslint-disable-line node/no-process-exit
};

const shutdown = () => {
    logger.info('Server wird heruntergefahren...');
    disconnectDB();
    process.exit(0); // eslint-disable-line node/no-process-exit
};
/* eslint-enable no-process-exit */

// Destructuring
const { cloud, host, port } = serverConfig;
const printBanner = () => {
    // Heroku entfernt fuehrende Leerzeichen
    const banner = `

    ( \      (  ___  )(  ____ \(  ____ \(  ____ \  (  ____ \(  ___  )(  ____ )(  ____ )
    | (      | (   ) || (    \/| (    \/| (    \/  | (    \/| (   ) || (    )|| (    )|
    | |      | (___) || (_____ | (_____ | (__      | |      | |   | || (____)|| (____)|
    | |      |  ___  |(_____  )(_____  )|  __)     | |      | |   | ||     __)|  _____)
    | |      | (   ) |      ) |      ) || (        | |      | |   | || (\ (   | (      
    | (____/\| )   ( |/\____) |/\____) || (____/\  | (____/\| (___) || ) \ \__| )_     
    (_______/|/     \|\_______)\_______)(_______/  (_______/(_______)|/   \__/|/(_)   
                                                                  
    `;

    logger.info(stripIndent(banner));
    // https://nodejs.org/api/process.html
    logger.info(`Node:           ${process.version}`);
    logger.info(`Betriebssystem: ${type()} ${release()}`);
    logger.info(`Rechnername:    ${host}`);
    logger.info(`IP-Adresse:     ${ip.address()}`);
    logger.info('');
    if (cloud === undefined) {
        logger.info(
            `https://${host}:${port} ist gestartet: Herunterfahren durch <Strg>C`,
        );
    } else {
        logger.info('Der Server ist gestartet: Herunterfahren durch <Strg>C');
    }
};

const startServer = () => {
    let server: Server | Application;
    if (cloud === undefined) {
        const { cert, key } = serverConfig;
        // Shorthand Properties
        const options: SecureContextOptions = {
            key,
            cert,
            minVersion: 'TLSv1.3',
        };
        // https://stackoverflow.com/questions/11744975/enabling-https-on-express-js#answer-11745114
        server = createServer(options, app as RequestListener);
    } else {
        server = app;
    }
    server.listen(port, printBanner);

    // util.promisify(fn) funktioniert nur mit Funktionen, bei denen
    // der error-Callback das erste Funktionsargument ist
    // <Strg>C
    process.on('SIGINT', shutdown);

    // nodemon nutzt SIGUSR2
    process.once('SIGUSR2', disconnectDB);

    // Falls bei einem Promise die Fehlerbehandlung fehlt
    process.on('unhandledRejection', (err) => {
        logger.error('unhandled rejection', err);
    });
};

// IIFE (= Immediately Invoked Function Expression) statt top-level await
// https://developer.mozilla.org/en-US/docs/Glossary/IIFE
// https://github.com/typescript-eslint/typescript-eslint/issues/647
// https://github.com/typescript-eslint/typescript-eslint/pull/1799
(async () => {
    try {
        await populateDB();
        await connectDB();
        startServer();
    } catch (err: unknown) {
        logger.error(`Fehler beim Start des Servers: ${JSON5.stringify(err)}`);
    }
})();
