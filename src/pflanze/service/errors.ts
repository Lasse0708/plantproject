/* eslint-disable max-classes-per-file, @typescript-eslint/no-type-alias */

import type { ValidationErrorMsg } from './../entity';

export class PflanzeServiceError {} // eslint-disable-line @typescript-eslint/no-extraneous-class

export class PflanzeInvalid extends PflanzeServiceError {
    constructor(readonly msg: ValidationErrorMsg) {
        super();
    }
}

export class NameExists extends PflanzeServiceError {
    constructor(readonly name: string, readonly id: string) {
        super();
    }
}

export class ArtikelnummerExists extends PflanzeServiceError {
    constructor(readonly artikelnummer: string, readonly id: string) {
        super();
    }
}

export type CreateError = PflanzeInvalid | NameExists | ArtikelnummerExists;

export class VersionInvalid extends PflanzeServiceError {
    constructor(readonly version: string | undefined) {
        super();
    }
}

export class VersionOutdated extends PflanzeServiceError {
    constructor(readonly id: string, readonly version: number) {
        super();
    }
}

export class PflanzeNotExists extends PflanzeServiceError {
    constructor(readonly id: string | undefined) {
        super();
    }
}

export type UpdateError =
    | PflanzeInvalid
    | PflanzeNotExists
    | NameExists
    | VersionInvalid
    | VersionOutdated;

export class PflanzeFileServiceError {} // eslint-disable-line @typescript-eslint/no-extraneous-class

export class FileNotFound extends PflanzeFileServiceError {
    constructor(readonly filename: string) {
        super();
    }
}

export class MultipleFiles extends PflanzeFileServiceError {
    constructor(readonly filename: string) {
        super();
    }
}

export type DownloadError = PflanzeNotExists | FileNotFound | MultipleFiles;

/* eslint-enable max-classes-per-file, @typescript-eslint/no-type-alias */
