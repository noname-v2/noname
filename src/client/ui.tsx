import { getState } from './state';
import type react from 'react';
import { App } from '../components/App';
import { Arena } from '../components/Arena';
import { Background } from '../components/Background';
import { Foreground } from '../components/Foreground';
import { Home } from '../components/Home';
import { Main } from '../components/Main';
import { Room } from '../components/Room';
import { Zoom } from '../components/Zoom';
export const UI = {
   App: (props: Dict) => App(...getState(props, UI)),
   Arena: (props: Dict) => Arena(...getState(props, UI)),
   Background: (props: Dict) => Background(...getState(props, UI)),
   Foreground: (props: Dict) => Foreground(...getState(props, UI)),
   Home: (props: Dict) => Home(...getState(props, UI)),
   Main: (props: Dict) => Main(...getState(props, UI)),
   Room: (props: Dict) => Room(...getState(props, UI)),
   Zoom: (props: Dict) => Zoom(...getState(props, UI)),
};
export interface ClientAPI {
   App: typeof App;
   Arena: typeof Arena;
   Background: typeof Background;
   Foreground: typeof Foreground;
   Home: typeof Home;
   Main: typeof Main;
   Room: typeof Room;
   Zoom: typeof Zoom;
   reply: (result: any) => void;
   sync: (tag: string, msg: any) => void;
   send: (tag: string, msg: any) => void;
   refresh: (delay?: number) => void;
   update: (diff: Dict) => void;
   react: typeof react;
   [key: `${Uppercase<string>}${string}`]: FC;
};
customElements.define('nn-app', class extends HTMLElement {});
customElements.define('nn-arena', class extends HTMLElement {});
customElements.define('nn-background', class extends HTMLElement {});
customElements.define('nn-foreground', class extends HTMLElement {});
customElements.define('nn-home', class extends HTMLElement {});
customElements.define('nn-main', class extends HTMLElement {});
customElements.define('nn-room', class extends HTMLElement {});
customElements.define('nn-zoom', class extends HTMLElement {});