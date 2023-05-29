import { getState } from './state';
import { getHub } from './hub';
import { App } from '../components/App';
import { Arena } from '../components/Arena';
import { Background } from '../components/Background';
import { Foreground } from '../components/Foreground';
import { Room } from '../components/Room';
import { Splash } from '../components/Splash';
import { Zoom } from '../components/Zoom';
export const UI = {
   App: (props: Dict) => App(getState(props), UI, getHub(props)),
   Arena: (props: Dict) => Arena(getState(props), UI, getHub(props)),
   Background: (props: Dict) => Background(getState(props), UI, getHub(props)),
   Foreground: (props: Dict) => Foreground(getState(props), UI, getHub(props)),
   Room: (props: Dict) => Room(getState(props), UI, getHub(props)),
   Splash: (props: Dict) => Splash(getState(props), UI, getHub(props)),
   Zoom: (props: Dict) => Zoom(getState(props), UI, getHub(props)),
};
export interface UIType {
   App: typeof App;
   Arena: typeof Arena;
   Background: typeof Background;
   Foreground: typeof Foreground;
   Room: typeof Room;
   Splash: typeof Splash;
   Zoom: typeof Zoom;
   [key: string]: FC;
};
customElements.define('nn-app', class extends HTMLElement {});
customElements.define('nn-arena', class extends HTMLElement {});
customElements.define('nn-background', class extends HTMLElement {});
customElements.define('nn-foreground', class extends HTMLElement {});
customElements.define('nn-room', class extends HTMLElement {});
customElements.define('nn-splash', class extends HTMLElement {});
customElements.define('nn-zoom', class extends HTMLElement {});