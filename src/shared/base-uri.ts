import { Cloud, serverConfig } from './config';
import type { Request } from 'express';

const { cloud } = serverConfig;
const port = cloud === undefined ? `:${serverConfig.port}` : '';

export const getBaseUri = (req: Request) => {
    const { protocol, hostname, baseUrl } = req;
    const schema = cloud === Cloud.HEROKU ? 'https' : protocol;
    return `${schema}://${hostname}${port}${baseUrl}`;
};
