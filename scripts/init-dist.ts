import { dir } from './shared';
import { exec } from 'shelljs';
import { join } from 'path';
import rimraf from 'rimraf';
import { serverConfig } from '../src/shared/config';

rimraf('server.*', (_: Error) => {});

const { src, dist } = dir;

const sharedSrc = join(src, 'shared');
const sharedDist = join(dist, 'shared');

const configSrc = join(sharedSrc, 'config');
const configDist = join(sharedDist, 'config');

// PEM-Dateien fuer JWT kopieren
const jwtPemSrc = join(configSrc, 'jwt');
const jwtPemDist = join(configDist, 'jwt');
exec(`npx copyfiles --flat ${jwtPemSrc}/* ${jwtPemDist}`);

// PNG-Datei fuer Neuladen der DB kopieren
const dbSrc = join(sharedSrc, 'db', 'image.png');
const dbDist = join(sharedDist, 'db');
exec(`npx copyfiles --flat ${dbSrc} ${dbDist}`);

if (serverConfig.cloud === undefined) {
    // PEM-Dateien und Zertifikatdatei fuer HTTPS kopieren
    exec(
        `npx copyfiles --flat ${configSrc}/*.pem ${configSrc}/*.cer ${configDist}`,
    );
}

// EJS: Views mit Partials, CSS, Bilder, Favicon, manifest.json, robots.txt
const viewsSrc = join(src, 'views');
const publicSrc = join(src, 'public');
exec(`npx copyfiles --up=1 ${viewsSrc}/** ${publicSrc}/** ${dist}`);
