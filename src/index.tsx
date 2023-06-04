import React from 'react';
import { createRoot } from 'react-dom/client';
import { UI } from './client/ui';
import { createWorker } from './client/state';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <React.StrictMode>
        <UI.App cid='app' />
    </React.StrictMode>
);

createWorker();
