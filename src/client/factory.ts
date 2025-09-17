import { isDict, apply } from "../utils";
import { createElement } from "./element";

export default class Factory {
    // parent, children and properties of each element, '-' for detached or root elements
    #tree = new Map<string, { parent: string, children: Set<string>, props: ComponentProps }>(
        [['body', { parent: '-', children: new Set(), props: {} }]]
    );

    // all created elements (id -> HTMLElement)
    #elements = new Map<string, HTMLElement>([['body', document.body]]);

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
    dispatch(ticks: Dict<ElementUpdate>) {
        const toAdd = new Map<string, [string, string]>(); // id -> [parent id, tag name] for new / moved elements
        const toUpdate = new Map<string, ComponentProps>(); // id -> updated properties
        const toUnlink = new Set<string>(); // ids to be removed

        // determine the type of each tick
        for (const id in ticks) {
            const tick = ticks[id];
            if (tick === 'x') {
                // delete entire subtree
                if (this.#tree.has(id)) {
                    toUnlink.add(id);
                }
                else if (this.#elements.has(id)) {
                    console.warn('Removing detached element', id);
                    this.#elements.get(id)!.remove();
                    this.#elements.delete(id);
                }
            }
            else if (Array.isArray(tick)) {
                // create or move element
                if (this.#tree.has(id)) {
                    // move existing element
                    const node = this.#tree.get(id)!;
                    if (node.parent === tick[1] && this.#elements.has(id)) {
                        // only update properties if parent is the same and element exists
                        toUpdate.set(id, tick[0]);
                    }
                    else {
                        // detach from previous parent
                        this.#tree.get(node.parent)?.children.delete(id);

                        // update parent and properties
                        node.parent = tick[1];
                        apply(node.props, tick[0]);
                        toAdd.set(id, [tick[1], tick[2]]);
                    }
                }
                else {
                    // create new element
                    toAdd.set(id, [tick[1], tick[2]]);
                    this.#tree.set(id, { parent: tick[1], children: new Set(), props: tick[0] });
                }
            }
            else if (isDict(tick)) {
                // update existing element
                if (this.#tree.has(id) && this.#elements.has(id)) {
                    toUpdate.set(id, tick);
                }
                else {
                    console.warn('Updating non-existing element', id);
                }
            }
        }

        // Construct the new element tree with added and moved elements
        for (const id of toAdd.keys()) {
            const parentId = this.#tree.get(id)!.parent;
            if (this.#tree.has(parentId)) {
                // Add to parent's children
                this.#tree.get(parentId)!.children.add(id);
            }
            else if (parentId !== '-') {
                // Mark for removal if parent does not exist
                console.warn('Parent not found for element', id, ', removing it.');
                toUnlink.add(id);
            }
        }

        // Update element tree by removing unlinked elements
        const unlink = (id: string) => {
            // Remove references to an element
            this.#tree.delete(id);
            this.#elements.delete(id);
            toAdd.delete(id);
            toUpdate.delete(id);
        };
        const unlinkChildren = (id: string) => {
            // Recursively remove the references all child elements
            this.#tree.get(id)?.children?.forEach(childId => {
                unlinkChildren(childId);
                unlink(childId);
            });
        };
        toUnlink.forEach(unlinkChildren);

        // Actual DOM operations for top-level elements to be removed
        for (const id of toUnlink) {
            if (this.#tree.has(id)) {
                this.#elements.get(id)?.remove();
                this.#tree.get(this.#tree.get(id)!.parent)?.children.delete(id);
                unlink(id);
            }
        }

        // Create new HTML elements or detach old HTML elements
        for (const [id, [_, tag]] of toAdd) {
            if (!this.#elements.has(id)) {
                this.#elements.set(id, createElement(tag));
            }
            else {
                this.#elements.get(id)!.remove();
            }
        }

        // Append the children of elements to be added or moved
        const ignoreAppend = new Set<string>(); // non-top-level elements to ignore DOM operation
        const appendChildren = (id: string) => {
            this.#tree.get(id)?.children?.forEach(childId => {
                if (this.#elements.has(childId)) {
                    this.#elements.get(id)?.appendChild(this.#elements.get(childId)!);
                }
                else {
                    console.warn('Child element', childId, 'not found when appending to', id);
                }
                if (toAdd.has(childId)) {
                    // children of this element will be appended elsewhere
                    ignoreAppend.add(childId);
                }
                else {
                    appendChildren(childId);
                }
            });
        };
        toAdd.keys().forEach(appendChildren);

        // Update element styles before appending to DOM
        toAdd.keys().forEach(id => {
            const props = this.#tree.get(id)!.props;
            const el = this.#elements.get(id)!;
            if (props?.style) {
                apply(el.style, props.style);
            }
            // from here: actually update styles by ComponentProps
        });

        // Append all top-level elements to DOM
        const frags = new Map<string, HTMLElement[]>();
        for (const id of toAdd.keys()) {
            if (ignoreAppend.has(id)) {
                continue;
            }
            const parentId = this.#tree.get(id)?.parent!;
            if (!frags.has(parentId)) {
                frags.set(parentId, []);
            }
            frags.get(parentId)!.push(this.#elements.get(id)!);
        }
        for (const [parentId, children] of frags) {
            this.#elements.get(parentId)?.append(...children);
        }

        // from here: address toUpdate
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