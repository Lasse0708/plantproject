import { exec } from 'shelljs';
import minimist from 'minimist';
import { resolve } from 'path';

const argv = minimist(process.argv.slice(0));
const values = argv._;

const image = 'barnes.biz/plants:1.0.0';
const containername = 'plants';

const startContainer = () => {
    const logfile = resolve(process.cwd(), 'server.log');
    exec(
        // prettier-ignore
        'docker run --publish 3000:3000 ' +
            `--mount type=bind,source=${logfile},destination=/usr/src/app/server.log ` +
            '--env TZ=Europe/Berlin ' +
            `--name ${containername} --hostname 127.0.0.1 --rm ` +
            image,
    );
};

const buildImage = () => {
    // Dockerfile im aktuellen Verzeichnis
    // Download der diversen Layer fuer node:x.y.z-buster
    exec(`docker build --tag ${image} .`);
};

switch (values[2]) {
    case undefined:
    case 'start':
        startContainer();
        break;

    case 'image':
    case 'buildImage':
        buildImage();
        break;

    default:
        console.log('npm run docker [start|buildImage]');
}
