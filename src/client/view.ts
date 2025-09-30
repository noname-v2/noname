import { apply } from '../utils';
import type Client from "./client";

// Type for point events (mouse/touch)
type PointEvent = MouseEvent | Touch;

// View class to manage user interaction and scaling
export default class View {
    // Reference to client object
    #client: Client;

    // Reference width and height of root element
    #refWidth = 960;
    #refHeight = 540;

    // Actual zoom level
    #zoom = 1;

    // Root element
    #root: HTMLElement;

    // Element id and event handlers given an HTMLElement
    #bindings = new Map<HTMLElement, [string, Pick<ElementProps, EventHandler>, boolean]>();

    // Temporarily block mouse events during touch events
    #mouseBlocked = null as ReturnType<typeof setTimeout> | null;

    /** Handler for current click event.
    * [0]: Element that is clicked.
    * [1]: Location of pointerdown.
    * [2]: mousedown is triggered by right click.
    */
    #clicking: [HTMLElement, [number, number], boolean] | null = null;

    // Temporarily disable event trigger after pointerup to prevent unintended clicks.
    #dispatched = false;

    constructor(root: HTMLElement, client: Client) {
        this.#root = root;
        this.#client = client;
        this.resize();
        window.addEventListener('resize', () => this.resize(), { passive: true });

        // Prevent default context menu
        root.oncontextmenu = e => {
            e.preventDefault();
            return false;
        };

        // Block mouse events for 1s after touch event
        root.addEventListener('touchstart', () => {
            this.#blockMouse();
        }, { passive: true });

        // Global touch event handlers
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

        // Global mouse event handlers
        root.addEventListener('mousemove', () => {
            if (!this.#mouseBlocked) {
                this.#dispatchMove();
            }
        }, { passive: true });
        root.addEventListener('mouseup', () => {
            if (!this.#mouseBlocked) {
                this.#dispatchUp();
            }
        }, { passive: true });
        root.addEventListener('mouseleave', () => {
            if (!this.#mouseBlocked) {
                this.#dispatchCancel();
            }
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
    #dispatchDown(elem: HTMLElement, e: PointEvent, right: boolean) {
        const binding = this.#bindings.get(elem);
        if (!binding) {
            return;
        }
        this.#client.logger.log('Mouse down', binding, e);

        const [_, handler, down] = binding;
        const origin = this.#locate(e);

        // initialize click event
        if (((handler.onClick && !right) || handler.onRightClick) && !this.#clicking) {
            this.#clicking = [elem, origin, right];
            // Add visual effect from .down class if needed
            if (handler.onClick && down) {
                elem.classList.add('down');
            }
            if (!right) {
                // simulate right click with long press
                if (handler.onRightClick) {
                    const bak = this.#clicking;
                    setTimeout(() => {
                        if (bak === this.#clicking) {
                            this.#clicking[2] = true;
                            this.#dispatchUp();
                        }
                    }, 500);
                }
            }
        }
    }

    #dispatchMove() {
    }

    #dispatchUp() {
        this.#client.logger.log('Mouse up');
        if (this.#dispatched === false) {
            // dispatch events
            if (this.#clicking) {
                this.#dispatched = true;
                this.#dispatchClick(this.#clicking[0]);
            }
            // re-enable event trigger after 310ms (slightly > app.css.transition)
            if (this.#dispatched) {
                window.setTimeout(() => this.#dispatched = false, 310);
            }
        }
        if (this.#clicking) {
            this.#clicking = null;
        }
    }

    #dispatchClick(elem: HTMLElement) {
        const binding = this.#bindings.get(elem);
        if (!binding || !this.#clicking || this.#clicking[0] !== elem) {
            return;
        }
        const [id, handler] = binding;

        if (handler.onClick && !this.#clicking[2]) {
            // trigger left click
            this.#client.logger.log('Mouse click', id, handler.onClick, this.#clicking[1]);
            this.#client.send([id, handler.onClick, this.#clicking[1]]);
        }
        else if (handler.onRightClick && this.#clicking[2]) {
            // trigger right click
            this.#client.logger.log('Mouse click', id, handler.onRightClick, this.#clicking[1]);
            this.#client.send([id, handler.onRightClick, this.#clicking[1]]);
        }
        else {
            // no handler
            this.#client.logger.log('Mouse click', id, 'no handler');
        }

        // avoid duplicate trigger
        this.#resetClick(elem);
    }

    // Cancel click callback for current pointerdown.
    #resetClick(elem: HTMLElement) {
        if (this.#clicking && this.#clicking[0] === elem) {
            this.#clicking = null;
        }
        elem.classList.remove('down');
    }

    #dispatchCancel() {
        if (this.#clicking) {
            this.#clicking[0].classList.remove('down');
        }
        this.#clicking = null;
    }

    // Get the location of mouse or touch event.
    #locate(e: PointEvent): [number, number] {
        return [
            Math.round(e.clientX / this.#zoom),
            Math.round(e.clientY / this.#zoom)
        ];
    }

    bind(elem: HTMLElement, id: string, handler: Pick<ElementProps, EventHandler>, down: boolean) {
        if (!this.#bindings.has(elem)) {
            this.#bindings.set(elem, [id, {}, down]);
            elem.addEventListener('touchstart', e => {
                this.#dispatchDown(elem, e.touches[0], e.touches.length === 2)
            }, { passive: true });
            elem.addEventListener('mousedown', e => {
                if (!this.#mouseBlocked) {
                    this.#dispatchDown(elem, e, e.button === 2);
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
        this.#zoom = z;
    }

    send(msg: any) {
        this.#client.send(msg);
    }
}