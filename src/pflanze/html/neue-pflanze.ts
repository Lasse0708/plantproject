import type { Request, Response } from 'express';

export const neuePflanze = (_: Request, res: Response) => {
    res.render('neues-pflanzen', { title: 'Neues Pflanze' });
};
