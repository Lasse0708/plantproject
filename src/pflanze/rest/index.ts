import type { Request, Response } from 'express';
import { PflanzeFileRequestHandler } from './pflanze-file.request-handler';
import { PflanzeRequestHandler } from './pflanze.request-handler';

const handler = new PflanzeRequestHandler();
const fileHandler = new PflanzeFileRequestHandler();

export const findById = (req: Request, res: Response) =>
    handler.findById(req, res);
export const find = (req: Request, res: Response) => handler.find(req, res);
export const create = (req: Request, res: Response) => handler.create(req, res);
export const update = (req: Request, res: Response) => handler.update(req, res);
export const deleteFn = (req: Request, res: Response) =>
    handler.delete(req, res);
export const upload = (req: Request, res: Response) =>
    fileHandler.upload(req, res);
export const download = (req: Request, res: Response) =>
    fileHandler.download(req, res);
