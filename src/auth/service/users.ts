import type { User } from './user.service';
import dotenv from 'dotenv';

dotenv.config();
const { env } = process;
const { USER_PASSWORD_ENCODED } = env;
const password = USER_PASSWORD_ENCODED as string;

// NICHT: Set statt [], weil es fuer Set keine Suchfunktion gibt
export const users: User[] = [
    {
        id: '20000000-0000-0000-0000-000000000001',
        username: 'admin',
        password,
        email: 'admin@acme.com',
        roles: ['admin', 'mitarbeiter', 'abteilungsleiter', 'kunde'],
    },
    {
        id: '20000000-0000-0000-0000-000000000002',
        username: 'adriana.alpha',
        password,
        email: 'adriana.alpha@acme.com',
        roles: ['admin', 'mitarbeiter', 'kunde'],
    },
    {
        id: '20000000-0000-0000-0000-000000000003',
        username: 'alfred.alpha',
        password,
        email: 'alfred.alpha@acme.com',
        roles: ['mitarbeiter', 'kunde'],
    },
    {
        id: '20000000-0000-0000-0000-000000000004',
        username: 'antonia.alpha',
        password,
        email: 'antonia.alpha@acme.com',
        roles: ['mitarbeiter', 'kunde'],
    },
    {
        id: '20000000-0000-0000-0000-000000000005',
        username: 'dirk.delta',
        password,
        email: 'dirk.delta@acme.com',
        roles: ['kunde'],
    },
    {
        id: '20000000-0000-0000-0000-000000000006',
        username: 'emilia.epsilon',
        password,
        email: 'emilia.epsilon@acme.com',
    },
];
