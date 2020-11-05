import JSON5 from 'json5';
import { logger } from '../../shared';
import { roles } from './roles';

export class RoleService {
    constructor() {
        logger.info(`RoleService: roles=${JSON5.stringify(roles)}`);
    }

    findAllRoles() {
        return roles;
    }

    getNormalizedRoles(rollen: readonly (string | undefined)[]) {
        if (rollen.length === 0) {
            logger.debug('RolesService.getNormalizedRoles(): []');
            return [];
        }

        const normalizedRoles = rollen.filter(
            (r) => this.getNormalizedRole(r) !== undefined,
        ) as string[];
        logger.debug(
            `RolesService.getNormalizedRoles(): ${JSON5.stringify(
                normalizedRoles,
            )}`,
        );
        return normalizedRoles;
    }

    private getNormalizedRole(role: string | undefined) {
        if (role === undefined) {
            return;
        }

        // Falls der Rollenname in Grossbuchstaben geschrieben ist, wird er
        // trotzdem gefunden
        return this.findAllRoles().find(
            (r) => r.toLowerCase() === role.toLowerCase(),
        );
    }
}
