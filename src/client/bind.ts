import { android, ios } from '../platform';
import { db } from './db';
import { getState } from './state';

/** Type for point location from an event. */
type EventPoint = {clientX: number, clientY: number, button?: number}

/** Callback for click or drag event. */
interface Binding {
	// current displacement
	offset?: Point;

	// maximium displacement
	movable?: Region;

	// move callback for pointermove
	onmove?: (e: Point) => any;

	// move callback for pointermove outside the range
	onoff?: (e1: Point, e2: Point) => Point;

	// move callback for pointerup
	onmoveend?: (arg: any) => void;

	// click callback for pointerup
	onclick?: (e: Point) => void;

	// callback for pointerdown
	ondown?: (e: Point) => void;

    // callback for right click or long press
    oncontext?: (e: Point) => void;
}

export type BindConfig = Binding | ((e: Point) => void);

/** Bindings for DOM events. */
const bindings = new Map<HTMLElement, Binding>();

/** Temperoary disable event trigger after pointerup to prevent unintended clicks. */
let dispatched = false;

/** Handler for current click event.
 * [0]: Element that is clicked.
 * [1]: Location of pointerdown.
 * [2]: true: started by a touch event, false: started by a mouse event.
 * [3]: mousedown is triggered by non-left click.
 */
let clicking: [HTMLElement, Point, boolean, boolean] | null = null;

/** Handler for current move event.
 * [0]: Element that is moved.
 * [1]: Location of pointerdown.
 * [2]: Initial transform of target element when pointerdown is fired.
 * [3]: Return value of the binding.onmove.
 * [4]: true: started by a touch event, false: started by a mouse event.
 */
let moving: [HTMLElement, Point, Point, any, boolean] | null = null;

/** Get the location of mouse or touch event. */
function locate(e: EventPoint): Point {
    const z = getState('zoom-state', 'zoom');

    return {
        x: z ? Math.round(e.clientX / z) : 0,
        y: z ? Math.round(e.clientY / z) : 0
    }
}

/** Register pointerdown for click or move. */
function register(node: HTMLElement) {
    // event callback
    const binding = {} as Binding;
    bindings.set(node, binding);

    // register event
    const dispatchDown = (e: EventPoint, touch: boolean) => {
        const origin = locate(e);

        // initialize click event
        const right = e.button ? true : false;
        if (((binding.onclick && !right) || binding.oncontext) && !clicking) {
            clicking = [node, origin, touch, right];
            if (!right) {
                // click down effect for left click
                if (binding.onclick) {
                    node.classList.add('clickdown');
                }

                // simulate right click with long press
                if (binding.oncontext) {
                    const bak = clicking;
                    setTimeout(() => {
                        if (bak === clicking) {
                            clicking[3] = true;
                            pointerEnd(touch);
                        }
                    }, 500);
                }
            }
        }

        // initialize move event
        if (binding.movable && !moving) {
            node.classList.add('movedown');
            moving = [node, origin, binding.offset || {x: 0, y: 0}, null, touch];

            // fire ondown event
            if (binding.ondown) {
                binding.ondown(origin);
            }
        }
    };

    node.addEventListener('touchstart', e => dispatchDown(e.touches[0], true), {passive: true});

    if (!ios && !android) {
        node.addEventListener('mousedown', e => dispatchDown(e, false), {passive: true});
    }

    return binding;
}

/** Cancel click callback for current pointerdown. */
function resetClick(node: HTMLElement) {
    if (clicking && clicking[0] === node) {
        clicking = null;
    }
    node.classList.remove('clickdown');
}

/** Cancel move callback for current pointerdown. */
function resetMove(node: HTMLElement) {
    if (moving && moving[0] === node) {
        moving = null;
    }
    node.classList.remove('movedown');
}

/** Callback for mousemove or touchmove. */
function pointerMove(e: EventPoint, touch: boolean) {
    const {x, y} = locate(e);

    // not a click event if move distance > 5px
    if (clicking && clicking[2] === touch) {
        const [node, origin] = clicking;
        const dx = origin.x - x;
        const dz = origin.y - y;
        
        if (dx * dx + dz * dz > 25) {
            resetClick(node);
        }
    }

    // get offset and trigger move event
    if (moving && moving[4] === touch) {
        const [node, origin, offset] = moving;
        const binding = bindings.get(node);
        if (binding?.movable) {
            if (binding.onclick || binding.oncontext) {
                const dx = origin.x - x;
                const dz = origin.y - y;

                if (dx * dx + dz * dz <= 25) {
                    return;
                }
            }

            dispatchMove(node, {
                x: x - origin.x + offset.x,
                y: y - origin.y + offset.y
            });
        }
    }
}

/** Ccallback for mouseup or touchend. */
function pointerEnd(touch: boolean) {
    if (dispatched === false) {
        // dispatch events
        if (clicking && clicking[2] === touch) {
            dispatched = true;
            dispatchClick(clicking[0]);
        }

        if (moving && moving[4] === touch) {
            dispatched = true;
            dispatchMoveEnd(moving[0]);
        }

        // re-enable event trigger after 100ms to avoid accidental double click
        if (dispatched) {
            window.setTimeout(() => dispatched = false, db?.get('click-timeout') ?? 100);
        }
    }

    if (clicking && clicking[2] === touch) {
        clicking = null;
    }
    
    if (moving && moving[4] === touch) {
        moving[0].classList.remove('movedown');
        moving = null;
    }
}

/** Callback for mouseleave or touchcancel. */
function pointerCancel(touch: boolean) {
    if (clicking && clicking[2] === touch) {
        clicking[0].classList.remove('clickdown');
    }

    if (moving && moving[4] === touch) {
        dispatchMoveEnd(moving[0]);
    }

    clicking = null;
    moving = null;
}

/** Resolved when document is ready. */
export const ready = new Promise<void>(async resolve => {
    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }

    // add bindings for drag operations
    document.body.addEventListener('touchmove', e => pointerMove(e.touches[0], true), {passive: true});
    document.body.addEventListener('touchend', () => pointerEnd(true), {passive: true});
    document.body.addEventListener('touchcancel', () => pointerCancel(true), {passive: true});

    // avoid unexpected mouse event behavior on some Android devices
    if (!android) {
        document.body.addEventListener('mousemove', e => pointerMove(e, false), {passive: true});
        document.body.addEventListener('mouseup', () => pointerEnd(false), {passive: true});
        document.body.addEventListener('mouseleave', () => pointerCancel(false), {passive: true});
    }

    // disable context menu
    document.oncontextmenu = () => false;

    resolve();
});

/** Set binding for move or click event. */
export function bind(node: HTMLElement, config: BindConfig | null) {
    if (config === null) {
        bindings.delete(node);
    }
    else {
        const binding = bindings.get(node) ?? register(node);
        if (typeof config === 'function') {
            binding.onclick = config;
        }
        else {
            Object.assign(binding, config);
        }
    }
}

/** Bind both onclick and oncontext. */
export function bindClick(node: HTMLElement, onclick: (e: Point) => void) {
    bind(node, { onclick, oncontext: onclick });
}

/** Fire click event. */
export function dispatchClick(node: HTMLElement) {
    const binding = bindings.get(node);

    // trigger left click
    if (binding?.onclick && (!clicking || !clicking[3])) {
        if (clicking && clicking[0] === node) {
            // use the location of clicking if applicable
            binding.onclick.call(node, clicking[1]);
        }
        else {
            // a pseudo click event without location info
            binding.onclick.call(node, {x: 0, y: 0});
        }
    }

    // trigger right click
    if (binding?.oncontext && clicking && clicking[3]) {
        binding.oncontext.call(node, clicking[1]);
    }

    // avoid duplicate trigger
    resetClick(node);
    resetMove(node);
}

/** Get the transform of an element in x direction. */
export function getX(node: HTMLElement) {
    return bindings.get(node)?.offset?.x ?? 0;
}

/** Get the transform of an element in x direction. */
export function getY(node: HTMLElement) {
    return bindings.get(node)?.offset?.y ?? 0;
}

/** Fire move event. */
export function dispatchMove(node: HTMLElement, location: Point) {
    const binding = bindings.get(node);

    if (binding?.movable) {
        // get offset of node
        const movable = binding.movable;
        let x = Math.min(Math.max(location.x, movable.x[0]), movable.x[1]);
        let y = Math.min(Math.max(location.y, movable.y[0]), movable.y[1]);

        // trigger onoff
        if (binding.onoff && (x != location.x || y != location.y)) {
            const off = binding.onoff({x, y}, {x: location.x, y: location.y});
            x = off.x;
            y = off.y;
        }
        
        // set and save node offset
        node.style.transform = `translate(${x}px, ${y}px)`;
        binding.offset = {x, y};

        // trigger onmove
        if (binding.onmove) {
            const state = binding.onmove(binding.offset);

            // save move state to moving if applicable
            if (moving && moving[0] === node) {
                moving[3] = state;
            }
        }
    }
}

/** Fire moveend event. */
export function dispatchMoveEnd(node: HTMLElement) {
    // onmoveend
    const binding = bindings.get(node);

    if (binding && binding.onmoveend) {
        if (moving && moving[0] === node) {
            // pass the state of moving if applicable
            binding.onmoveend(moving[3]);
        }
        else {
            // a pseudo moveend event without current state
            binding.onmoveend(null);
        }
    }

    // avoid duplicate trigger
    resetClick(node);
    resetMove(node);
}
