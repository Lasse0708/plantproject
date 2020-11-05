import { HttpStatus, logger } from '../../shared';
import type { NextFunction, Request, Response } from 'express';
import { AuthService } from '../service';
import JSON5 from 'json5';

class AuthorizationRequestHandler {
    private readonly authService = new AuthService();

    isAdmin(req: Request, res: Response, next: NextFunction) {
        if (!this.hasRolle(req, res, 'admin')) {
            logger.debug('AuthRequestHandler.isAdmin(): false');
            return;
        }

        logger.debug('AuthRequestHandler.isAdmin(): ok');
        // Verarbeitung fortsetzen
        next();
    }

    isMitarbeiter(req: Request, res: Response, next: NextFunction) {
        if (!this.hasRolle(req, res, 'mitarbeiter')) {
            logger.debug('AuthRequestHandler.isMitarbeiter(): false');
            return;
        }

        logger.debug('AuthRequestHandler.isMitarbeiter(): ok');
        // Verarbeitung fortsetzen
        next();
    }

    isAdminMitarbeiter(req: Request, res: Response, next: NextFunction) {
        if (!this.hasRolle(req, res, 'admin', 'mitarbeiter')) {
            logger.debug('AuthRequestHandler.isAdminMitarbeiter(): false');
            return;
        }

        logger.debug('AuthRequestHandler.isAdminMitarbeiter(): ok');
        // Verarbeitung fortsetzen
        next();
    }

    // Spread-Parameter
    private hasRolle(req: Request, res: Response, ...roles: readonly string[]) {
        logger.debug(`Rollen = ${JSON5.stringify(roles)}`);

        if (!this.authService.isLoggedIn(req)) {
            logger.debug('AuthRequestHandler.hasRolle(): 401');
            res.sendStatus(HttpStatus.UNAUTHORIZED);
            return false;
        }

        if (!this.authService.hasAnyRole(req, roles)) {
            logger.debug('AuthRequestHandler.hasRolle(): 403');
            logger.debug('403');
            res.sendStatus(HttpStatus.FORBIDDEN);
            return false;
        }

        logger.debug('AuthRequestHandler.hasRolle(): ok');
        return true;
    }
}

const handler = new AuthorizationRequestHandler();

export const isAdmin = (req: Request, res: Response, next: NextFunction) =>
    handler.isAdmin(req, res, next);

export const isMitarbeiter = (
    req: Request,
    res: Response,
    next: NextFunction,
) => handler.isMitarbeiter(req, res, next);

export const isAdminMitarbeiter = (
    req: Request,
    res: Response,
    next: NextFunction,
) => handler.isAdminMitarbeiter(req, res, next);
