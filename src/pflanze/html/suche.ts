import type { Request, Response } from 'express';
import { PflanzeService } from '../service/pflanze.service';
import { logger } from '../../shared/logger';

const pflanzeService = new PflanzeService();

export const suche = async (req: Request, res: Response) => {
    logger.error(`suche(): ${req.url}`);
    const pflanzen = await pflanzeService.find();
    res.render('suche', { title: 'Suche', pflanzen });
};
