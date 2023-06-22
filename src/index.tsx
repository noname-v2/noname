import React from 'react';
import { createRoot } from 'react-dom/client';
import './components';
import { ui } from './client/ui';
import { createWorker } from './client/state';

const container = document.getElementById('root');
const root = createRoot(container!);
const App = ui('App') as FC;
root.render(
    <React.StrictMode>
        <App cid='app' />
    </React.StrictMode>
);

createWorker();
