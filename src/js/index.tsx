import React from 'react';
import { createRoot } from 'react-dom/client';
import { UI } from './client/ui';
import { setState } from './client/state';
import { hubState } from './client/hub';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <React.StrictMode>
        <UI.App cid='app' />
    </React.StrictMode>
);

hubState.worker = new Worker(new URL('./worker/local.ts', import.meta.url), {type: 'module'});
hubState.worker.onmessage = ({data}) => {
    for (const cid in data) {
        if (cid === '^') {
            hubState.asked = data[cid];
        }
        else {
            setState(cid, data[cid]);
        }
    }
}
