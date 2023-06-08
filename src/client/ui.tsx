import { createState, StateAPI } from './state';
import { App } from '../components/App';
import { Arena } from '../components/Arena';
import { Background } from '../components/Background';
import { Foreground } from '../components/Foreground';
import { Home } from '../components/Home';
import { Main } from '../components/Main';
import { Room } from '../components/Room';
import { Zoom } from '../components/Zoom';
export const UI = {
   App: (props: Dict) => App(...createState(props, UI)),
   Arena: (props: Dict) => Arena(...createState(props, UI)),
   Background: (props: Dict) => Background(...createState(props, UI)),
   Foreground: (props: Dict) => Foreground(...createState(props, UI)),
   Home: (props: Dict) => Home(...createState(props, UI)),
   Main: (props: Dict) => Main(...createState(props, UI)),
   Room: (props: Dict) => Room(...createState(props, UI)),
   Zoom: (props: Dict) => Zoom(...createState(props, UI)),
};
export interface ClientAPI extends StateAPI {
   App: typeof App;
   Arena: typeof Arena;
   Background: typeof Background;
   Foreground: typeof Foreground;
   Home: typeof Home;
   Main: typeof Main;
   Room: typeof Room;
   Zoom: typeof Zoom;
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