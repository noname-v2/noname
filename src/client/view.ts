// View class to manage user interaction and scaling
export default class View {
    // Reference width and height of root element
    #refWidth = 960;
    #refHeight = 540;

    // Root element
    #root: HTMLElement;

    // Event handlers
    #bindings = new Map<HTMLElement, [string, EventHandlers]>();

    constructor(root: HTMLElement) {
        this.#root = root;
        this.resize();

        // Prevent default context menu
        root.oncontextmenu = e => {
            e.preventDefault();
            return false;
        };
    }

    bind<K extends keyof EventHandlers>(elem: HTMLElement, id: string, evt: K, handler: EventHandlers[K]) {
        if (!this.#bindings.has(elem)) {
            this.#bindings.set(elem, [id, {}]);
        }
        this.#bindings.get(elem)![1][evt] = handler;
        // from here: add event listeners.
    }

    resize() {
        // actual window size
        const width = window.innerWidth;
        const height = window.innerHeight;

        // ideal size based on reference aspect ratio
        const ax = this.#refWidth;
        const ay = this.#refHeight;

        // zoom to fit ideal size
        const zx = width / ax, zy = height / ay;

        // Final width, height and zoom level
        let z: number, w: number, h: number;

        if (zx < zy) {
            w = ax;
            h = ax / width * height;
            z = zx;
        }
        else {
            w = ay / height * width;
            h = ay;
            z = zy;
        }

        // update styles
        this.#root.style.setProperty('--zoom-width', w + 'px');
        this.#root.style.setProperty('--zoom-height', h + 'px');
        this.#root.style.setProperty('--zoom-scale', z.toString());
    }
}