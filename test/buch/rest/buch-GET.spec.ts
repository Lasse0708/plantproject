/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { HttpStatus, serverConfig } from '../../../src/shared';
import { agent, createTestserver } from '../../testserver';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import type { AddressInfo } from 'net';
import type { PflanzeData } from '../../../src/pflanze/entity';
import { PATHS } from '../../../src/app';
import type { Server } from 'http';
import chai from 'chai';
import each from 'jest-each';
import fetch from 'node-fetch';

const { expect } = chai;

// IIFE (= Immediately Invoked Function Expression) statt top-level await
// https://developer.mozilla.org/en-US/docs/Glossary/IIFE
(async () => {
    // startWith(), endWith()
    const chaiString = await import('chai-string');
    chai.use(chaiString.default);
})();

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const nameVorhanden = ['a', 't', 'g'];
const nameNichtVorhanden = ['xx', 'yy'];
const schlagwoerterVorhanden = ['javascript', 'typescript'];
const schlagwoerterNichtVorhanden = ['csharp', 'php'];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
let server: Server;
const path = PATHS.pflanzen;
let buecherUri: string;

// Test-Suite
describe('GET /pflanzen', () => {
    beforeAll(async () => {
        server = await createTestserver();

        const address = server.address() as AddressInfo;
        buecherUri = `https://${serverConfig.host}:${address.port}${path}`;
    });

    afterAll(() => server.close());

    test('Alle Pflanzen', async () => {
        // given

        // when
        const response = await fetch(buecherUri, { agent });

        // then
        const { status, headers } = response;
        expect(status).to.be.equal(HttpStatus.OK);
        expect(headers.get('Content-Type')).to.match(/json/iu);
        // https://jestjs.io/docs/en/expect
        // JSON-Array mit mind. 1 JSON-Objekt
        const pflanzen: Array<any> = await response.json();
        expect(pflanzen).not.to.be.empty;
        pflanzen.forEach((pflanze) => {
            const selfLink = pflanze._links.self.href;
            expect(selfLink).to.have.string(path);
        });
    });

    each(nameVorhanden).test(
        'Pflanzen mit einem Name, der "%s" enthaelt',
        async (teilName) => {
            // given
            const uri = `${buecherUri}?name=${teilName}`;

            // when
            const response = await fetch(uri, { agent });

            // then
            const { status, headers } = response;
            expect(status).to.be.equal(HttpStatus.OK);
            expect(headers.get('Content-Type')).to.match(/json/iu);
            // JSON-Array mit mind. 1 JSON-Objekt
            const body = await response.json();
            expect(body).not.to.be.empty;

            // Jedes Pflanze hat einen Name mit dem Teilstring 'a'
            body.map((pflanze: PflanzeData) => pflanze.name).forEach((name: string) =>
                expect(name.toLowerCase()).to.have.string(teilName),
            );
        },
    );

    each(nameNichtVorhanden).test(
        'Keine Pflanzen mit einem Name, der "%s" nicht enthaelt',
        async (teilName) => {
            // given
            const uri = `${buecherUri}?name=${teilName}`;

            // when
            const response = await fetch(uri, { agent });

            // then
            expect(response.status).to.be.equal(HttpStatus.NOT_FOUND);
            const body = await response.text();
            expect(body).to.be.equalIgnoreCase('not found');
        },
    );

    each(schlagwoerterVorhanden).test(
        'Mind. 1 Pflanze mit dem Schlagwort "%s"',
        async (schlagwort) => {
            // given
            const uri = `${buecherUri}?${schlagwort}=true`;

            // when
            const response = await fetch(uri, { agent });

            // then
            const { status, headers } = response;
            expect(status).to.be.equal(HttpStatus.OK);
            expect(headers.get('Content-Type')).to.match(/json/iu);
            // JSON-Array mit mind. 1 JSON-Objekt
            const body = await response.json();
            expect(body).not.to.be.empty;

            // Jedes Pflanze hat im Array der Schlagwoerter "javascript"
            body.map(
                (pflanze: PflanzeData) => pflanze.schlagwoerter,
            ).forEach((s: Array<string>) =>
                expect(s).to.include(schlagwort.toUpperCase()),
            );
        },
    );

    each(schlagwoerterNichtVorhanden).test(
        'Keine Pflanzen mit dem Schlagwort "%s"',
        async (schlagwort) => {
            // given
            const uri = `${buecherUri}?${schlagwort}=true`;

            // when
            const response = await fetch(uri, { agent });

            // then
            expect(response.status).to.be.equal(HttpStatus.NOT_FOUND);
            const body = await response.text();
            expect(body).to.be.equalIgnoreCase('not found');
        },
    );
});
