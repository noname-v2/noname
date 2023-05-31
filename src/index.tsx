import React from 'react';
import { createRoot } from 'react-dom/client';
import { UI } from './client/ui';
import { setState, createWorker } from './client/state';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <React.StrictMode>
        <UI.App cid='app' />
    </React.StrictMode>
);

const worker = createWorker();
worker.onmessage = ({data}) => {
    for (const cid in data) {
        setState(cid, data[cid]);
    }
}
