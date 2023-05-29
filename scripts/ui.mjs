import {promises as fs} from 'fs';

const imports = [`import { getState } from './state';`, `import { getHub } from './hub';`];
const ui = ['', 'export const UI = {',];
const uiType = ['', 'export interface UIType {',]
const dom = [''];
const react = [
    `import * as React from 'react';`,
    'declare global {',
    '    namespace JSX {',
    '        interface IntrinsicElements {'
];
const sheets = [`@import 'src/css/mixin.scss';`];

function getTag(cmp) {
    let tag = 'nn-' + cmp[0].toLowerCase();
    for (let i = 1; i < cmp.length; i++) {
        const c = cmp[i].toLowerCase();
        if (c !== cmp[i]) {
            tag += '-';
        }
        tag += c;
    }
    return tag;
}

for (const src of await fs.readdir('./src/js/components')) {
    const cmp = src.split('.')[0];
    const tag = getTag(cmp);
    imports.push(`import { ${cmp} } from '../components/${cmp}';`);
    ui.push(`   ${cmp}: (props: Dict) => ${cmp}(getState(props), UI, getHub(props)),`);
    uiType.push(`   ${cmp}: typeof ${cmp};`);
    react.push(`            '${tag}': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string }, HTMLElement>;`)
    dom.push(`customElements.define('${tag}', class extends HTMLElement {});`);
}

for (const src of await fs.readdir('./src/css')) {
    if (src === 'mixin.scss' || src === 'index.scss') {
        continue;
    }
    sheets.push(`@import 'src/css/${src}';`);
}

ui.push('};');
uiType.push('   [key: string]: FC;')
uiType.push('};');
react.push('        }\n    }\n}');

await fs.writeFile('src/js/client/ui.tsx', imports.join('\n') + ui.join('\n') + uiType.join('\n') + dom.join('\n'));
await fs.writeFile('src/js/react.d.ts', react.join('\n'));
await fs.writeFile('src/css/index.scss', sheets.join('\n'));
