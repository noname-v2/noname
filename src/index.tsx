import React from 'react';
import { createRoot } from 'react-dom/client';
import './client/ui';
import { ui } from './client/components';
import { createWorker } from './client/state';

const container = document.getElementById('root');
const root = createRoot(container!);
const { App } = ui();
root.render(
    <React.StrictMode>
        <App cid='app' />
    </React.StrictMode>
);

createWorker();
