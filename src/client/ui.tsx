import { UIArgs } from './hub';
import { App } from '../components/App';
import { Arena } from '../components/Arena';
import { Background } from '../components/Background';
import { Foreground } from '../components/Foreground';
import { Room } from '../components/Room';
import { Splash } from '../components/Splash';
import { Zoom } from '../components/Zoom';
export const UI = {
   App: (props: Dict) => App(...UIArgs(props, UI)),
   Arena: (props: Dict) => Arena(...UIArgs(props, UI)),
   Background: (props: Dict) => Background(...UIArgs(props, UI)),
   Foreground: (props: Dict) => Foreground(...UIArgs(props, UI)),
   Room: (props: Dict) => Room(...UIArgs(props, UI)),
   Splash: (props: Dict) => Splash(...UIArgs(props, UI)),
   Zoom: (props: Dict) => Zoom(...UIArgs(props, UI)),
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