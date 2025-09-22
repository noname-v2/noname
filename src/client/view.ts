import logger from '../logger';
import { apply } from '../utils';

// View class to manage user interaction and scaling
export default class View {
    // Reference width and height of root element
    #refWidth = 960;
    #refHeight = 540;

    // Root element
    #root: HTMLElement;

    // Element id and event handlers given an HTMLElement
    #bindings = new Map<HTMLElement, [string, Pick<ElementProps, EventHandler>, boolean]>();

    // Temporarily block mouse events during touch events
    #mouseBlocked = null as ReturnType<typeof setTimeout> | null;

    constructor(root: HTMLElement) {
        this.#root = root;
        this.resize();

        // Prevent default context menu
        root.oncontextmenu = e => {
            e.preventDefault();
            return false;
        };

        // Global touch event handlers
        root.addEventListener('touchstart', () => {
            this.#blockMouse();
        }, { passive: true });

        root.addEventListener('touchmove', () => {
            this.#blockMouse();
            this.#dispatchMove();
        }, { passive: true });

        root.addEventListener('touchend', () => {
            this.#blockMouse();
            this.#dispatchUp();
        }, { passive: true });

        root.addEventListener('touchcancel', () => {
            this.#blockMouse();
            this.#dispatchCancel();
        }, { passive: true });
    }

    #blockMouse() {
        if (this.#mouseBlocked) {
            clearTimeout(this.#mouseBlocked);
        }
        this.#mouseBlocked = setTimeout(() => {
            this.#mouseBlocked = null;
        }, 1000);
    }

    // Bind mousedown / touchstart event to add .down class
    #dispatchDown(elem: HTMLElement, e: MouseEvent | TouchEvent) {
        const binding = this.#bindings.get(elem);
        if (!binding) {
            return;
        }
        logger.log('down', binding, e);
        if (binding[2]) {
            elem.classList.add('down');
        }
        // from here: dispatch event to component method
    }

    #dispatchMove() {
    }

    #dispatchUp() {
    }

    #dispatchCancel() {
    }

    bind(elem: HTMLElement, id: string, handler: Pick<ElementProps, EventHandler>, down: boolean) {
        if (!this.#bindings.has(elem)) {
            this.#bindings.set(elem, [id, {}, down]);
            elem.addEventListener('touchstart', e => this.#dispatchDown(elem, e), { passive: true });
            elem.addEventListener('mousedown', e => {
                if (!this.#mouseBlocked) {
                    this.#dispatchDown(elem, e);
                }
            }, { passive: true });
        }

        const binding = this.#bindings.get(elem)!;
        apply(binding[1], handler);
        binding[2] = down;
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