import { pflanze, pflanzen } from './pflanze';
import JSON5 from 'json5';
import type { Pflanze } from '../../entity';
import { logger } from '../../../shared';
import { v4 as uuid } from 'uuid';

/* eslint-disable @typescript-eslint/no-unused-vars,require-await,@typescript-eslint/require-await */
export class PflanzeServiceMock {
    async findById(id: string) {
        pflanze._id = id;
        return pflanze;
    }

    async find(_?: unknown) {
        return pflanzen;
    }

    async create(pflanzeData: Pflanze) {
        pflanzeData._id = uuid();
        logger.info(`Neues Pflanze: ${JSON5.stringify(pflanzeData)}`);
        return pflanzeData;
    }

    async update(pflanzeData: Pflanze) {
        if (pflanzeData.__v !== undefined) {
            pflanzeData.__v++;
        }
        logger.info(`Aktualisiertes Pflanze: ${JSON5.stringify(pflanzeData)}`);
        return Promise.resolve(pflanzeData);
    }

    async remove(id: string) {
        logger.info(`ID des geloeschten Pflanzees: ${id}`);
        return true;
    }
}

/* eslint-enable @typescript-eslint/no-unused-vars,require-await,@typescript-eslint/require-await */
