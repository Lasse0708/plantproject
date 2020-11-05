import { Schema, model, set } from 'mongoose';
import { autoIndex, optimistic } from '../../shared';
// RFC version 1: timestamps            https://github.com/uuidjs/uuid#uuidv1options-buffer-offset
// RFC version 3: namespace mit MD5     https://github.com/uuidjs/uuid#uuidv3name-namespace-buffer-offset
// RFC version 4: random                https://github.com/uuidjs/uuid#uuidv4options-buffer-offset
// RFC version 5: namespace mit SHA-1   https://github.com/uuidjs/uuid#uuidv5name-namespace-buffer-offset
import { v4 as uuid } from 'uuid';

// Eine Collection in MongoDB besteht aus Dokumenten im BSON-Format

set('debug', true);

// Mongoose ist von Valeri Karpov, der auch den Begriff "MEAN-Stack" gepraegt hat:
// http://thecodebarbarian.com/2013/04/29//easy-web-prototyping-with-mongodb-and-nodejs
// Ein Schema in Mongoose definiert die Struktur und Methoden fuer die
// Dokumente in einer Collection.
// Ein Property im Schema definiert eine Property fuer jedes Dokument.
// Ein Schematyp (String, Number, Boolean, Date, Array, ObjectId) legt den Typ
// der Property fest.
// Objection.js ist ein alternatives Werkzeug für ORM:
// http://vincit.github.io/objection.js

// https://mongoosejs.com/docs/schematypes.html
export const pflanzeSchema = new Schema(
    {
        // MongoDB erstellt implizit einen Index fuer _id
        // mongoose-id-assigner hat geringe Download-Zahlen und
        // uuid-mongodb hat keine Typ-Definitionen fuer TypeScript
        _id: { type: String, default: uuid }, // eslint-disable-line @typescript-eslint/naming-convention
        name: { type: String, required: true},
        wuchshoehe: { type: Number, min: 0, max: 5 },
        pflanzentyp: {
            type: String,
            enum: ['GARTENPFLANZE', 'ZIMMERPFLANZE', 'NUTZPFLANZE'],
        },
        versandart: {
            type: String,
            required: true,
            enum: ['VERSAND', 'SELBSTABHOLUNG', 'OUT_OF_STOCK'],
        },
        preis: { type: Number, required: true },
        rabatt: Number,
        lieferbar: Boolean,
        artikelnr: {
            type: String,
            required: true,
            immutable: true,
        },
        herkunft: String,
        schlagwoerter: { type: [String], sparse: true },
        zulieferer: [Schema.Types.Mixed],
    },
    {
        // createdAt und updatedAt als automatisch gepflegte Felder
        timestamps: true,
        // http://thecodebarbarian.com/whats-new-in-mongoose-5-10-optimistic-concurrency.html
        // @ts-expect-error optimisticConcurrency ab 5.10, @types/mongoose ist fuer 5.7
        optimisticConcurrency: true,
        autoIndex,
    },
);

// Optimistische Synchronisation durch das Feld __v fuer die Versionsnummer
pflanzeSchema.plugin(optimistic);

// Methoden zum Schema hinzufuegen, damit sie spaeter beim Model (s.u.)
// verfuegbar sind, was aber bei pflanze.check() zu eines TS-Syntaxfehler fuehrt:
// schema.methods.check = () => {...}
// schema.statics.findByTitel =
//     (titel: string, cb: Function) =>
//         return this.find({titel: titel}, cb)

// Ein Model ist ein uebersetztes Schema und stellt die CRUD-Operationen fuer
// die Dokumente bereit, d.h. das Pattern "Active Record" wird realisiert.
// Name des Models = Name der Collection
export const PflanzenModel = model('Pflanzen', pflanzeSchema); // eslint-disable-line @typescript-eslint/naming-convention
