export enum Pflanzentyp {
    GARTENPFLANZE = 'GARTENPFLANZE',
    ZIMMERPFLANZE = 'ZIMMERPFLANZE',
    NUTZPFLANZE = 'NUTZPFLANZE',
}

export enum Versandart {
    VERSAND = 'VERSAND',
    SELBSTABHOLUNG = 'SELBSTABHOLUNG',
    OUT_OF_STOCK = 'OUT_OF_STOCK',
}

// gemeinsames Basis-Interface fuer REST und GraphQL
export interface Pflanze {
    _id?: string; // eslint-disable-line @typescript-eslint/naming-convention
    __v?: number; // eslint-disable-line @typescript-eslint/naming-convention
    name: string | undefined | null;
    wuchshoehe: number | undefined | null;
    pflanzentyp: Pflanzentyp | '' | undefined | null;
    versandart: Versandart | '' | undefined | null;
    preis: number;
    rabatt: number | undefined;
    lieferbar: boolean;
    artikelnummer: string | undefined | null;
    herkunft: string | undefined | null;
    schlagwoerter?: string[];
    zulieferer: unknown;
}

export interface PflanzeData extends Pflanze {
    createdAt?: number;
    updatedAt?: number;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links?: {
        self?: { href: string };
        list?: { href: string };
        add?: { href: string };
        update?: { href: string };
        remove?: { href: string };
    };
}
