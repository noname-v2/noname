import React from 'react';
import { createRoot } from 'react-dom/client';
import { UI } from './client/ui';
import { setState } from './client/state';
import { state } from './client/api';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <React.StrictMode>
        <UI.App cid='app' />
    </React.StrictMode>
);

state.worker = new Worker(new URL('./worker/local.ts', import.meta.url), {type: 'module'});
state.worker.onmessage = ({data}) => {
    for (const cid in data) {
        if (cid === '^') {
            state.asked = data[cid];
        }
        else {
            setState(cid, data[cid]);
        }
    }
}
