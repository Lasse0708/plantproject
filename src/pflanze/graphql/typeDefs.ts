/**
 * Typdefinitionen fuer GraphQL:
 *  Vordefinierte skalare Typen
 *      Int: 32‐bit Integer
 *      Float: Gleitkommmazahl mit doppelter Genauigkeit
 *      String:
 *      Boolean: true, false
 *      ID: eindeutiger Bezeichner, wird serialisiert wie ein String
 *  Pflanze: eigene Typdefinition für Queries
 *        "!" markiert Pflichtfelder
 *  Query: Signatur der Lese-Methoden
 *  Mutation: Signatur der Schreib-Methoden
 */

import { gql } from 'apollo-server-express';

// https://www.apollographql.com/docs/apollo-server/migration-two-dot/#the-gql-tag
// https://www.apollographql.com/docs/apollo-server/schema/schema

// "Tagged Template String", d.h. der Template-String wird durch eine Funktion
// (hier: gql) modifiziert. Die Funktion gql wird fuer Syntax-Highlighting und
// fuer die Formatierung durch Prettier verwendet.
export const typeDefs = gql`
    "Enum-Typ fuer die Art einer Pflanze"
    enum Pflanzentyp {
        GARTENPFLANZE
        ZIMMERPFLANZE
        NUTZPFLANZE
    }

    "Enum-Typ fuer die Versandart einer Pflanze"
    enum Versandart {
        VERSAND
        SELBSTABHOLUNG
        OUT_OF_STOCK
    }

    "Datenschema einer Pflanze, das empfangen oder gesendet wird"
    type Pflanze {
        id: ID!
        version: Int
        name: String!
        wuchshoehe: Int
        pflanzentyp: Pflanzentyp
        versandart: Versandart!
        preis: Float
        rabatt: Float
        lieferbar: Boolean
        artikelnummer: String
        herkunft: String
        schlagwoerter: [String]
    }

    "Funktionen, um Pflanzen zu empfangen"
    type Query {
        pflanzen(name: String): [Pflanze]
        pflanze(id: ID!): Pflanze
    }

    "Funktionen, um Pflanzen anzulegen, zu aktualisieren oder zu loeschen"
    type Mutation {
        createPflanze(
            name: String!
            wuchshoehe: Int
            pflanzentyp: Pflanzentyp
            versandart: Versandart!
            preis: Float
            rabatt: Float
            lieferbar: Boolean
            artikelnummer: String
            herkunft: String
            schlagwoerter: [String]
        ): Pflanze
        updatePflanze(
            _id: ID
            name: String!
            wuchshoehe: Int
            pflanzentyp: Pflanzentyp
            versandart: Versandart!
            preis: Float
            rabatt: Float
            lieferbar: Boolean
            artikelnummer: String
            herkunft: String
            schlagwoerter: [String]
            version: Int
        ): Pflanze
        deletePflanze(id: ID!): Boolean
    }
`;
