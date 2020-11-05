import { Pflanzentyp, Versandart } from '../../entity';
import type { PflanzeData } from '../../entity';

/* eslint-disable @typescript-eslint/naming-convention */

export const pflanze: PflanzeData = {
    _id: '00000000-0000-0000-0000-000000000001',
    name: 'Alocasia',
    wuchshoehe: 4,
    pflanzentyp: Pflanzentyp.GARTENPFLANZE,
    versandart: Versandart.VERSAND,
    preis: 11.1,
    rabatt: 0.011,
    lieferbar: true,
    artikelnummer: '000-0000000001',
    herkunft: 'Subtropical Asia to Eastern Australia',
    schlagwoerter: ['Immergrün'],
    zulieferer: [
        {
            name: 'Dehner',
            homepage: 'https://www.dehner.de/',
        },
        {
            name: 'Hornbach',
            homepage: 'https://www.hornbach.de/',
        },
    ],
    __v: 0,
    createdAt: 0,
    updatedAt: 0,
};

export const pflanzen: PflanzeData[] = [
    pflanze,
    {
        _id: '00000000-0000-0000-0000-000000000002',
        name: 'Monstera',
        wuchshoehe: 2,
        pflanzentyp: Pflanzentyp.ZIMMERPFLANZE,
        versandart: Versandart.SELBSTABHOLUNG,
        preis: 22.2,
        rabatt: 0.022,
        lieferbar: true,
        artikelnummer: '000-0000000002',
        herkunft: 'Tropical regions of the Americas',
        schlagwoerter: ['Fensterblatt'],
        zulieferer: [
            {
                name: 'Dehner',
                homepage: 'https://www.dehner.de/',
            },
        ],
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
    },
];

/* eslint-enable @typescript-eslint/naming-convention */
