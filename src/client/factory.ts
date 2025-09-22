import logger from '../logger';
import View from './view';
import { isDict, apply } from "../utils";
import { createElement } from "./element";

export default class Factory {
    // CSS style sheet
    #style = document.createElement('style');

    // global transition duration multiplier
    #global_duration = 300; // ms

    // parent, children and properties of each element, '-' for detached or root elements
    #tree = new Map<string, { parent: string, children: Set<string>, props: ElementProps }>(
        [['root', { parent: '-', children: new Set(), props: {} }]]
    );

    // User interaction and scaling manager
    #view: View;

    // Function to send messages to worker / server
    #send: (msg: any) => void;

    // All created elements (id -> HTMLElement)
    #elements = new Map<string, HTMLElement>();

    constructor(root: HTMLElement, send: (msg: any) => void) {
        // Set root element and sender
        this.#elements.set('root', root);
        this.#send = send;

        // Add style element to document head
        document.head.appendChild(this.#style);

        // Initialize the size of root element
        this.#view = new View(root);
    }

    // handle messages from worker / server
    dispatch(ticks: ClientUpdate) {
        const toAdd = new Map<string, [string, string]>(); // id -> [parent id, tag name] for new / moved elements
        const toUpdate = new Map<string, ElementProps>(); // id -> updated properties
        const toUnlink = new Set<string>(); // ids to be removed

        // determine the type of each tick
        for (const id in ticks) {
            const tick = ticks[id];
            if (id === 'dur') {
                if (typeof tick === 'number' && !isNaN(tick) && tick < 5000 && tick > 0) {
                    this.#global_duration = tick;
                }
            }
            else if (id === 'css') {
                this.#style.innerHTML = tick as string;
            }
            else if (typeof tick === 'string') {
                // Predefined actions
                if (tick === 'x') {
                    // delete entire subtree
                    if (this.#tree.has(id)) {
                        toUnlink.add(id);
                    }
                    else if (this.#elements.has(id)) {
                        logger.warn('Removing detached element', id);
                        this.#elements.get(id)!.remove();
                        this.#elements.delete(id);
                    }
                }
            }
            else if (Array.isArray(tick)) {
                // create or move element
                if (this.#tree.has(id)) {
                    // move existing element
                    const node = this.#tree.get(id)!;
                    if (node.parent === tick[1] && this.#elements.has(id)) {
                        // update properties if parent is the same and element exists
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
                    this.#tree.set(id, { parent: tick[1], children: new Set(), props: tick[0] });
                    toAdd.set(id, [tick[1], tick[2]]);
                }
            }
            else if (isDict(tick)) {
                // update existing element
                if (this.#tree.has(id) && this.#elements.has(id)) {
                    toUpdate.set(id, tick);
                }
                else {
                    logger.warn('Updating non-existing element', id);
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
                logger.warn('Parent not found for element', id, ', removing it.');
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

        // Create new elements if necessary
        for (const [id, [_, tag]] of toAdd) {
            if (!this.#elements.has(id)) {
                // Create new HTML elements
                this.#elements.set(id, createElement(tag));
            }
            else {
                // Keep existing element and remove from old parent
                this.#elements.get(id)!.remove();
            }
        }

        // Append non-top-level DOM elements to their parents first
        const ignoreAppend = new Set<string>();
        const appendChildren = (id: string) => {
            this.#tree.get(id)?.children?.forEach(childId => {
                if (this.#elements.has(id) && this.#elements.has(childId)) {
                    this.#elements.get(id)!.appendChild(this.#elements.get(childId)!);
                }
                else {
                    logger.warn('Child element', childId, 'not found when appending to', id);
                }
                if (toAdd.has(childId)) {
                    // children of this element will be appended in the toAdd.keys().forEach(...) loop
                    ignoreAppend.add(childId);
                }
                else {
                    appendChildren(childId);
                }
            });
        };
        toAdd.keys().forEach(appendChildren);

        // Set element styles before appending to DOM
        toAdd.keys().forEach(id => {
            this.init(id);
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

    // initialize the style of an element
    init(id: string) {
        const props = this.#tree.get(id)!.props;
        const elem = this.#elements.get(id)!;

        // Apply initial properties
        if (props?.style) {
            apply(elem.style, props.style);
        }
        if (props?.className) {
            elem.className = props.className;
        }
        if (props?.dataset) {
            for (const key in props.dataset) {
                elem.dataset[key] = props.dataset[key];
            }
        }
        if (typeof props?.innerHTML === 'string') {
            elem.innerHTML = props.innerHTML;
        }

        // Bind events
        for (const evt of ['onClick', 'onRightClick', 'onDoubleClick', 'onMouseDown', 'onContextMenu', 'onDrop'] as const) {
            if (props?.[evt]) {
                this.#view.bind(elem, id, { [evt]: props[evt] }, props.down ?? false);
            }
        }

        // from here: actually update styles by ElementProps
    }

    // update the style of an element
    update(id: string, newProps: ElementProps) {
        const props = this.#tree.get(id)!.props || newProps;
        const elem = this.#elements.get(id)!;
        if (props?.style) {
            apply(elem.style, props.style);
        }
        // from here: actually update styles by ElementProps
        logger.log(this.#global_duration);
    }

    send(msg: any) {
        this.#send(msg);
    }

    reload(e?: unknown) {
        // TODO: reload the entire UI
        logger.error('Worker error:', e);
    }

    onmessage(data: any) {
        try {
            this.dispatch(data);
        }
        catch (error) {
            this.reload(error);
        }
    }

    close() {
        this.#style.remove();
        this.#elements.get('root')?.remove();
    }
}
