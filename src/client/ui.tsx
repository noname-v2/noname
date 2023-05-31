import { getState } from './state';
import { App } from '../components/App';
import { Arena } from '../components/Arena';
import { Background } from '../components/Background';
import { Foreground } from '../components/Foreground';
import { Room } from '../components/Room';
import { Splash } from '../components/Splash';
import { Zoom } from '../components/Zoom';
export const UI = {
   App: (props: Dict) => App(...getState(props, UI)),
   Arena: (props: Dict) => Arena(...getState(props, UI)),
   Background: (props: Dict) => Background(...getState(props, UI)),
   Foreground: (props: Dict) => Foreground(...getState(props, UI)),
   Room: (props: Dict) => Room(...getState(props, UI)),
   Splash: (props: Dict) => Splash(...getState(props, UI)),
   Zoom: (props: Dict) => Zoom(...getState(props, UI)),
};
export interface ClientAPI {
   App: typeof App;
   Arena: typeof Arena;
   Background: typeof Background;
   Foreground: typeof Foreground;
   Room: typeof Room;
   Splash: typeof Splash;
   Zoom: typeof Zoom;
   reply: (result: any) => void;
   sync: (tag: string, msg: any) => void;
   send: (tag: string, msg: any) => void;
   refresh: (delay?: number) => void;
   update: (diff: Dict) => void;
   [key: `${Uppercase<string>}${string}`]: FC;
};
customElements.define('nn-app', class extends HTMLElement {});
customElements.define('nn-arena', class extends HTMLElement {});
customElements.define('nn-background', class extends HTMLElement {});
customElements.define('nn-foreground', class extends HTMLElement {});
customElements.define('nn-room', class extends HTMLElement {});
customElements.define('nn-splash', class extends HTMLElement {});
customElements.define('nn-zoom', class extends HTMLElement {});