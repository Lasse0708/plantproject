import { Cloud, serverConfig } from './server';
import { format } from 'winston';

// Winston: seit 2010 bei GoDaddy (Registrierung von Domains)
// Log-Levels: error, warn, info, debug, verbose, silly, ...
// Medien (= Transports): Console, File, ...
// https://github.com/winstonjs/winston/blob/master/docs/transports.md
// Alternative: Bunyan, Pino

const { colorize, combine, json, simple, timestamp } = format;
const { cloud, production } = serverConfig;

const loglevelConsoleDev = cloud === undefined ? 'info' : 'debug';
const consoleFormat =
    cloud === undefined ? combine(colorize(), simple()) : simple();
export const consoleOptions = {
    level: production && cloud !== Cloud.HEROKU ? 'warn' : loglevelConsoleDev,
    format: consoleFormat,
};

export const fileOptions = {
    filename: 'server.log',
    level: production ? 'info' : 'debug',
    // 250 KB
    maxsize: 250000,
    maxFiles: 3,
    format: combine(timestamp(), json()),
};
