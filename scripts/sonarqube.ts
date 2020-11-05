import { exec } from 'shelljs';
import minimist from 'minimist';
import { resolve } from 'path';

const argv = minimist(process.argv.slice(0));
const values = argv._;

const version = '8.5.0-community';
const versionScanner = '4.5';
const containerName = 'sonarqube';

const startSonarQube = () => {
    // docker pull sonarqube:$version

    const hostPort = '9000';
    console.log(
        `URL fuer den SonarQube-Container: http://localhost:${hostPort}`,
    );
    console.log('');
    // login=admin, password=Software Engineering WI.

    const sonarqubeDir = resolve('C:\\', 'Zimmermann', 'volumes', 'sonarqube');
    exec(
        // prettier-ignore
        'docker run --publish 9000:9000 ' +
            `--mount type=bind,source=${resolve(sonarqubeDir, 'data')},destination=/opt/sonarqube/data ` +
            `--mount type=bind,source=${resolve(sonarqubeDir, 'logs')},destination=/opt/sonarqube/logs ` +
//            `--mount type=bind,source=${resolve(sonarqubeDir, 'extensions')},destination=/opt/sonarqube/extensions ` +
            '--env TZ=Europe/Berlin ' +
            `--name ${containerName} --rm ` +
            `sonarqube:${version}`,
    );
};

const scan = () => {
    exec(
        // prettier-ignore
        'docker run ' +
            `--mount type=bind,source=${process.cwd()},destination=/usr/src ` +
            '--env SONAR_HOST_URL="http://host.docker.internal:9000" ' +
            '--name sonar-scanner-cli --rm ' +
            `sonarsource/sonar-scanner-cli:${versionScanner}`,
    );
};

switch (values[2]) {
    case 'scan':
        scan();
        break;

    case 'start':
    default:
        startSonarQube();
}
