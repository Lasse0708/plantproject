import {
    NameExists,
    PflanzeInvalid,
    PflanzeNotExists,
    VersionInvalid,
    VersionOutdated,
} from '../service/errors';

import type { Pflanze } from '../entity';
import { PflanzeService } from '../service';
// import type { IResolvers } from 'graphql-tools';
import { logger } from '../../shared';

const pflanzeService = new PflanzeService();

// https://www.apollographql.com/docs/apollo-server/data/resolvers
// Zugriff auf Header-Daten, z.B. Token
// https://www.apollographql.com/docs/apollo-server/migration-two-dot/#accessing-request-headers
// https://www.apollographql.com/docs/apollo-server/security/authentication

// Resultat mit id (statt _id) und version (statt __v)
// __ ist bei GraphQL fuer interne Zwecke reserviert
const withIdAndVersion = (pflanze: Pflanze) => {
    const result: any = pflanze;
    result.id = pflanze._id;
    result.version = pflanze.__v;
    return pflanze;
};

const findPflanzeById = async (id: string) => {
    const pflanze = await pflanzeService.findById(id);
    if (pflanze === undefined) {
        return;
    }
    return withIdAndVersion(pflanze);
};

const findPflanzen = async (titel: string | undefined) => {
    const suchkriterium = titel === undefined ? {} : { titel };
    const pflanzen = await pflanzeService.find(suchkriterium);
    return pflanzen.map((pflanze) => withIdAndVersion(pflanze));
};

interface TitelCriteria {
    titel: string;
}

interface IdCriteria {
    id: string;
}

const createPflanze = async (pflanze: Pflanze) => {
    const result = await pflanzeService.create(pflanze);
    console.log(`resolvers createPflanze(): result=${JSON.stringify(result)}`);
    return result;
};

const logUpdateResult = (
    result:
        | Pflanze
        | PflanzeInvalid
        | NameExists
        | PflanzeNotExists
        | VersionInvalid
        | VersionOutdated,
) => {
    if (result instanceof PflanzeInvalid) {
        logger.debug(
            `resolvers updatePflanze(): validation msg = ${JSON.stringify(
                result.msg,
            )}`,
        );
    } else if (result instanceof NameExists) {
        logger.debug(
            `resolvers updatePflanze(): vorhandener name = ${result.name}`,
        );
    } else if (result instanceof PflanzeNotExists) {
        logger.debug(
            `resolvers updatePflanze(): nicht-vorhandene id = ${result.id}`,
        );
    } else if (result instanceof VersionInvalid) {
        logger.debug(
            `resolvers updatePflanze(): ungueltige version = ${result.version}`,
        );
    } else if (result instanceof VersionOutdated) {
        logger.debug(
            `resolvers updatePflanze(): alte version = ${result.version}`,
        );
    } else {
        logger.debug(
            `resolvers updatePflanze(): pflanze aktualisiert = ${JSON.stringify(
                result,
            )}`,
        );
        // TODO hier wird getrickst, um __v als "version" im Resultat zu haben
        const updateResult: any = result;
        updateResult.version = result.__v;
    }
};

const updatePflanze = async (pflanze: Pflanze) => {
    logger.debug(
        `resolvers updatePflanze(): zu aktualisieren = ${JSON.stringify(
            pflanze,
        )}`,
    );
    const version = pflanze.__v ?? 0;
    const result = await pflanzeService.update(pflanze, version.toString());
    logUpdateResult(result);
    return result;
};

const deletePflanze = async (id: string) => {
    const result = await pflanzeService.delete(id);
    logger.debug(`resolvers deletePflanze(): result = ${result}`);
    return result;
};

// Queries passend zu "type Query" in typeDefs.ts
const query = {
    // Pflanzen suchen, ggf. mit Titel als Suchkriterium
    pflanzen: (_: unknown, { titel }: TitelCriteria) => findPflanzen(titel),
    // Ein Pflanze mit einer bestimmten ID suchen
    pflanze: (_: unknown, { id }: IdCriteria) => findPflanzeById(id),
};

const mutation = {
    createPflanze: (_: unknown, pflanze: Pflanze) => createPflanze(pflanze),
    updatePflanze: (_: unknown, pflanze: Pflanze) => updatePflanze(pflanze),
    deletePflanze: (_: unknown, { id }: IdCriteria) => deletePflanze(id),
};

export const resolvers /* : IResolvers */ = {
    Query: query, // eslint-disable-line @typescript-eslint/naming-convention
    Mutation: mutation, // eslint-disable-line @typescript-eslint/naming-convention
};
