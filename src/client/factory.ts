import { isDict, apply } from "../utils";

export default class Factory {
    // parent and children of each element (id -> [parent id, Set<children id>])
    #tree = new Map<number, [number, Set<number>]>();

    // all created elements (id -> HTMLElement)
    #elements = new Map<number, HTMLElement>();

    constructor(src: string) {
        const worker = new Worker(src);

        worker.onerror = (e) => {
            console.error('Worker error:', e.message, 'in', e.filename, 'at line', e.lineno);
        };

        worker.onmessage = (e) => {
            try {
                this.dispatch(e.data);
            }
            catch (error) {
                this.reload(error);
            }
        };

        // from here: createRoot() and sync UI
        // elements: Map<id: int, [tag: string, className?: string, style?: Dict<Plain>, ...children: number[]]>
        // from here: client-side elements folder for CustomElement definitions (drag, resize, lines, ...)
        // WeakMap<customElement, [props, state, callback, ...]>
        // WeakMap<customElement, children>
        // WeakMap<customElement, parent>
        // customElements should only be used for real-time interactions like dragging and swiping when sending to worker is too expensive
    }

    // handle messages from worker / server
    dispatch(ticks: ElementUpdate[]) {
        const toAdd = new Map<number, [string, number]>(); // id -> [tag name, parent id]
        const toRemove = new Set<number>();
        const toUpdate = new Map<number, ElementUpdate>();
        // const toAnimate = new Map<number, unknown>(); TODO: animation

        // determine the type of each tick
        for (const tick of ticks) {
            const id = tick.u;
            if (tick.r === 1) {
                // delete entire subtree
                toRemove.add(id);
            }
            else {
                if (tick.t) {
                    // create new element
                    toAdd.set(id, tick.t);
                    this.#tree.set(id, [tick.t[1], new Set()]);
                }

                // Initialize or merge updates to element properties
                toUpdate.has(id) ? apply(toUpdate.get(id)!, tick) : toUpdate.set(id, tick);
            }
        }

        // construct the complete element tree with the added elements
        for (const [id] of toAdd) {
            const [parentId] = this.#tree.get(id)!;
            // add to parent's children or mark for removal if parent does not exist
            this.#tree.has(parentId) ? this.#tree.get(parentId)?.[1].add(id) : toRemove.add(id);
        }

        // update tree accounting for elements to be removed
        const ignoreRemove = new Set<number>(); // elements with parents also being removed
        const removeChildren = (id: number) => {
            // do not update removed elements
            toAdd.delete(id);
            toUpdate.delete(id);

            if (!this.#tree.has(id)) {
                return;
            }

            // recursively remove children
            const [parentId, children] = this.#tree.get(id)!;
            for (const childId of children) {
                // If child is already in the removing list, ignore it
                // and ignore the actual remove() operation since the parent removal will do it
                toRemove.has(childId) ? ignoreRemove.add(childId) : removeChildren(childId);
            }

            // remove from tree
            this.#tree.delete(id);
            this.#tree.get(parentId)?.[1].delete(id);
        };
        for (const id of toRemove) {
            removeChildren(id);
        }
    }

    remove(id: number, removeFromDOM = true) {
        if (!this.#elements.has(id)) {
            return;
        }
        const [parentId, children, elem] = this.#elements.get(id)!;
        
        if (removeFromDOM) {
            // remove from DOM (defer actual removal until the end if current UI update)
            if (!this.#toRemove) {
                this.#toRemove = document.createDocumentFragment();
                setTimeout(() => {
                    document.body.removeChild(this.#toRemove!);
                    this.#toRemove = null;
                });
            }
            this.#toRemove.appendChild(elem);

            // remove from parent's children list
            this.#elements.get(parentId)?.[1]?.delete(id);
        }

        // remove child data recursively
        for (const childId of children) {
            this.remove(childId, false);
        }

        // remove reference
        this.#elements.delete(id);
    }

    create(id: number, data: ElementUpdate) {
        
    }

    update(id: number, data: ElementUpdate) {

    }

    reload(e?: unknown) {
        // TODO: reload the entire UI
        console.error('Worker error:', e);
    }
}


// Useful lifecycle callback methods in a custom element (extending HTMLElement) include:

// connectedCallback()
// Called each time the element is inserted into the DOM.

// Ideal for setup tasks like rendering, fetching resources, or adding event listeners.

// Similar to React’s componentDidMount.

// disconnectedCallback()
// Called each time the element is removed from the DOM.

// Use it to clean up event listeners, stop timers, or release resources.

// Similar to React’s componentWillUnmount.

// attributeChangedCallback(name, oldValue, newValue)
// Called whenever one of the element’s observed attributes changes.

// To use this, define a static observedAttributes array listing attribute names to watch.

// Useful for responding to changes in element attributes dynamically.