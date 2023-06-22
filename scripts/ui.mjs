import {promises as fs} from 'fs';

const imports = [`import { createState } from './state';`, `import { register } from './components';`];
const ui = [''];
const react = [
    `import * as React from 'react';`,
    'declare global {',
    '    namespace JSX {',
    '        interface IntrinsicElements {'
];
const sheets = [`@import 'src/css/mixin.scss';`];

for (const src of await fs.readdir('./src/components')) {
    const cmp = src.split('.')[0];
    imports.push(`import ${cmp} from '../components/${cmp}';`);
    ui.push(`register(${cmp}, null, createState);`);
    react.push(`            'nn-${cmp}': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string, style?: {[key: string]: string | number} }, HTMLElement>;`);
}

for (const src of await fs.readdir('./src/css')) {
    if (src === 'mixin.scss' || src === 'index.scss') {
        continue;
    }
    sheets.push(`@import 'src/css/${src}';`);
}

react.push('        }\n    }\n}');

await fs.writeFile('src/client/ui.tsx', imports.join('\n') + ui.join('\n'));
await fs.writeFile('src/react.d.ts', react.join('\n'));
await fs.writeFile('src/css/index.scss', sheets.join('\n'));
