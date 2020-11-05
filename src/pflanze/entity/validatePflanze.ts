import { MAX_RATING, logger } from '../../shared';
import type { Pflanze } from './pflanze';
import JSON5 from 'json5';
import validator from 'validator';

const { isEAN, isLocale } = validator;

export interface ValidationErrorMsg {
    id?: string;
    name?: string;
    pflanzentyp?: string;
    wuchshoehe?: string;
    versandart?: string;
    artikelnummer?: string;
    herkunft?: string;
}

/* eslint-disable max-lines-per-function, no-null/no-null */
export const validatePflanze = (pflanze: Pflanze) => {
    const err: ValidationErrorMsg = {};
    const {
        name,
        pflanzentyp,
        wuchshoehe,
        versandart,
        artikelnummer,
        herkunft,
    } = pflanze;

    if (name === undefined || name === null || name === '') {
        err.name = 'Eine Pflanze muss einen Namen haben.';
    } else if (!/^\w.*/u.test(name)) {
        err.name =
            'Ein Pflanzenname muss mit einem Buchstaben, einer Ziffer oder _ beginnen.';
    }

    if (
        pflanzentyp === undefined ||
        pflanzentyp === null ||
        pflanzentyp === ''
    ) {
        err.pflanzentyp = 'Der Typ einer Pflanze muss gesetzt sein';
    } else if (
        (pflanzentyp as unknown) !== 'GARTENPFLANZE' &&
        (pflanzentyp as unknown) !== 'ZIMMERPFLANZE' &&
        (pflanzentyp as unknown) !== 'NUTZPFLANZE'
    ) {
        err.pflanzentyp =
            'Der Typ einer Pflanze muss GARTENPFLANZE, ZIMMERPFLANZE oder NUTZPFLANZE sein.';
    }

    if (
        wuchshoehe !== undefined &&
        wuchshoehe !== null &&
        (wuchshoehe < 0 || wuchshoehe > MAX_RATING)
    ) {
        err.wuchshoehe = `${wuchshoehe} ist keine gültige Höhe.`;
    }

    if (versandart === undefined || versandart === null || versandart === '') {
        err.versandart = 'Die Versandart einer Pflanze muss gesetzt sein.';
    } else if (
        (versandart as unknown) !== 'VERSAND' &&
        (versandart as unknown) !== 'SELBSTABHOLUNG' &&
        (versandart as unknown) !== 'OUT_OF_STOCK'
    ) {
        err.versandart =
            'Die Versandart einer Pflanze muss VERSAND, SELBSTABHOLUNG oder OUT_OF_STOCK sein.';
    }

    if (
        artikelnummer !== undefined &&
        artikelnummer !== null &&
        (typeof artikelnummer !== 'string' || !isEAN(artikelnummer))
    ) {
        err.artikelnummer = `'${artikelnummer}' ist keine gültige Artikelnummer.`;
    }

    if (
        herkunft !== undefined &&
        herkunft !== null &&
        (typeof herkunft !== 'string' || !isLocale(herkunft))
    ) {
        err.herkunft = `'${herkunft}' ist keine gültige Herkunft.`;
    }

    logger.debug(`validatePflanze: err=${JSON5.stringify(err)}`);
    return Object.entries(err).length === 0 ? undefined : err;
};
/* eslint-enable max-lines-per-function, no-null/no-null */
