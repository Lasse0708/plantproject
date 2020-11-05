import { exec } from 'shelljs';

const containername = 'fake-smtp-server';
const version = '1.6.0';

console.log('');
console.log(`fake-smtp-server ${version} wird als Docker-Container gestartet`);
console.log('');

exec(
    // prettier-ignore
    'docker run ' +
        '--publish 5025:5025 --publish 5080:5080 --publish 5081:5081 ' +
        '--env spring.output.ansi.enabled=ALWAYS ' +
        '--env spring.jpa.open-in-view=true ' +
        '--env TZ=Europe/Berlin ' +
        `--name ${containername} --rm ` +
        `gessnerfl/fake-smtp-server:${version}`,
);
