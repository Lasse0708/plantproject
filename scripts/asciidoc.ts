// https://github.com/asciidoctor/asciidoctor.js
// https://asciidoctor-docs.netlify.com
// https://github.com/eshepelyuk/asciidoctor-plantuml.js
// https://asciidoctor.org

import Asciidoctor from 'asciidoctor';
import { join } from 'path';
// @ts-ignore
import plantuml from 'asciidoctor-plantuml';

const asciidoctor = Asciidoctor();
console.log(`Asciidoctor.js ${asciidoctor.getVersion()}`);

plantuml.register(asciidoctor.Extensions);

const options = {
    safe: 'safe',
    attributes: { linkcss: true },
    base_dir: 'doc/entwicklerhandbuch',
    to_dir: 'html',
    mkdirs: true,
};
asciidoctor.convertFile(
    join('doc', 'entwicklerhandbuch', 'entwicklerhandbuch.adoc'),
    options,
);
console.log(
    `HTML-Datei ${join(
        __dirname,
        '..',
        'doc',
        'entwicklerhandbuch',
        'html',
        'entwicklerhandbuch.html',
    )}`,
);

// https://asciidoctor.github.io/asciidoctor.js/master
// const htmlString = asciidoctor.convert(
//     fs.readFileSync(join('doc', 'entwicklerhandbuch.adoc')),
//     { safe: 'safe', attributes: { linkcss: true }, base_dir: 'doc' },
// );
// const htmlFile = join('doc', 'entwicklerhandbuch.html');
// fs.writeFileSync(htmlFile, htmlString);

// console.log(`HTML-Datei ${join(__dirname, '..', htmlFile)}`);
