import type { Options } from 'nodemailer/lib/smtp-transport';
import { serverConfig } from './server';

export const mailConfig: Options = {
    host: serverConfig.mailHost,
    port: serverConfig.mailPort,
    secure: false,

    // Googlemail:
    // service: 'gmail',
    // auth: {
    //     user: 'myAcc@gmail.com',
    //     pass: 'mypassword'
    // }

    priority: 'normal',
    logger: serverConfig.mailLog,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    headers: { 'X-ProvidedBy': 'Software Engineering' },
};
