import {promises as fs} from 'fs';

const imports = [`import { getState } from './state';`, `import type { createRef } from 'react';`];
const ui = ['', 'export const UI = {',];
const uiType = ['', 'export interface ClientAPI {',]
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

for (const src of await fs.readdir('./src/components')) {
    const cmp = src.split('.')[0];
    const tag = getTag(cmp);
    imports.push(`import { ${cmp} } from '../components/${cmp}';`);
    ui.push(`   ${cmp}: (props: Dict) => ${cmp}(...getState(props, UI)),`);
    uiType.push(`   ${cmp}: typeof ${cmp};`);
    react.push(`            '${tag}': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string, style?: {[key: string]: string | number} }, HTMLElement>;`)
    dom.push(`customElements.define('${tag}', class extends HTMLElement {});`);
}

for (const src of await fs.readdir('./src/css')) {
    if (src === 'mixin.scss' || src === 'index.scss') {
        continue;
    }
    sheets.push(`@import 'src/css/${src}';`);
}

ui.push('};');
uiType.push('   reply: (result: any) => void;');
uiType.push('   sync: (tag: string, msg: any) => void;');
uiType.push('   send: (tag: string, msg: any) => void;');
uiType.push('   refresh: (delay?: number) => void;');
uiType.push('   update: (diff: Dict) => void;');
uiType.push('   createRef: typeof createRef<HTMLElement>;');
uiType.push('   [key: `${Uppercase<string>}${string}`]: FC;');
uiType.push('};');
react.push('        }\n    }\n}');

await fs.writeFile('src/client/ui.tsx', imports.join('\n') + ui.join('\n') + uiType.join('\n') + dom.join('\n'));
await fs.writeFile('src/react.d.ts', react.join('\n'));
await fs.writeFile('src/css/index.scss', sheets.join('\n'));
