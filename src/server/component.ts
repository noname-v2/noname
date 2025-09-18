import { toKebab, isDict, apply } from "../utils";
import translate from "./locale";

// Component data storage
const components = new WeakMap<Component, ComponentNode>();

// ID of the next component to be created.
let nextId = 1;

// Pending updates to be processed and sent to main thread
let pending: Dict<ComponentUpdate> | null = null;

// Process pending updates and send to main thread
function sync() {
    if (!pending) {
        return;
    }
}

// Schedule a component update
function tick(cmp: Component, update: ComponentUpdate) {
    if (pending === null) {
        pending = {};
        queueMicrotask(sync);
    }
    const node = components.get(cmp)!;
    const id = node.id;
    if (id in pending) {
         // merge updates
         if (update === 'x') {
            pending[id] = 'x';
         }
         else if (pending[id] === 'x') {
            console.warn("Component already marked for deletion, cannot update.");
         }
         else if (typeof update === 'string') {
            // Apply queued props change immediately since parent is changed
            if (isDict(pending[id])) {
                apply(node.props, pending[id]);
            }
            pending[id] = update;
         }
         else if (typeof pending[id] === 'string') {
            // Update props directly if parent is changed
            if (isDict(update)) {
                apply(node.props, update);
            }
         }
         else if (isDict(pending[id]) && isDict(update)) {
            // Merge props update
            apply(pending[id], update);
         }
         else {
            console.warn("Unknown update type: ", pending[id], update);
         }
    }
    else {
        // Create a new update
        pending[id] = update;
    }
}

// // Default component layout properties
// const defaultLayout = {
//     opacity: 1,
//     x: 0,
//     y: 0,
//     z: 0,
//     scale: 1,
//     scaleX: 1,
//     scaleY: 1,
//     scaleZ: 1,
//     rotate: 0,
//     rotateX: 0,
//     rotateY: 0,
//     rotateZ: 0,
//     left: null,
//     top: null,
//     right: null,
//     bottom: null,
//     width: null,
//     height: null,
//     aspectRatio: null
// };

// Data wrapper for component properties
class ComponentNode {
    id = (nextId++).toString(); // unique component ID
    tag: string // Component class name, e.g. "App"
    children: Component[] = []; // Child components added by this.append()
    parent: Component | null = null; // Parent component
    source: Component | null = null; // Source component with the render() method that creates this component
    props: ComponentProps = {}; // Component data

    constructor(tag: string) {
        this.tag = tag;
    }

    // TODO: Convert to Plain
    flatten() { }
}

// Component currently being rendered.
let rendering: Component | null = null;

// Rendered components under a component being re-rendered, to be deleted if not resolved
const resolving = new Set<Component>();

// Components already matched with a new Component from render()
const resolved = new Set<Component>();

// Mark a component and its children as resolved / unresolved
function unresolve(cmp: Component) {
    resolving.add(cmp);
    for (const child of components.get(cmp)!.children) {
        if (components.get(child)!.source === rendering) {
            unresolve(child);
        }
    }
}

function render(cmp: Component) {
    // from here: iterate over children and add all with source === rendering to unresolved
    if (rendering !== null || resolved.size || resolving.size) {
        console.warn("An component is already being rendered: " + rendering + " <- " + cmp);
        return;
    }

    // Setup render environment
    rendering = cmp;
    unresolve(cmp);
    const n = resolving.size;
    cmp.render();

    // Remove outdated children
    for (const child of resolving) {
        child.unlink();
    }

    // Cleanup
    if (resolving.size || resolved.size !== n) {
        console.warn(`Unmatched components after render(): ${resolving.size} unresolved, ${resolved.size} resolved, total ${n}`);
    }
    resolving.clear();
    resolved.clear();
}

// Create a function for making component instances
export function getMaker(tag: string, cls: ComponentType, ui: ExtensionAPI['ui']): ComponentMaker {
    return (...args) => {
        const cmp = new cls();
        const node = new ComponentNode(tag);
        components.set(cmp, node);

        for (const arg of args) {
            if (arg instanceof Component) {
                // Append arg as child component
                cmp.append(arg);
            }
            else if (Array.isArray(arg)) {
                // Append arg as child components
                for (const item of arg) {
                    cmp.append(item);
                }
            }
            else if (isDict(arg)) {
                // Assign component properties
                apply(node.props, arg);
            }
            else if (typeof arg === "string") {
                // Append text node
                cmp.append(ui.span({ innerHTML: translate(arg) }));
            }
            else if (typeof arg === "number") {
                // Slot index, to be handled by parent component
                node.props.slot = arg;
            }
        }

        if (node.props.innerHTML !== undefined && node.children.length > 0) {
            console.warn("Component cannot have both innerHTML and children.");
        }

        return cmp;
    };
}

function matched(a: ComponentNode, b: ComponentNode) {
    // Check constructor
    if (a.tag !== b.tag) {
        return false;
    }

    // Check the render() method that created the component
    if (a.source !== b.source) {
        return false;
    }

    // Check slots, slotA === slotB or both null/undefined
    if (a.props.slot !== b.props.slot) {
        return a.props.slot == null && b.props.slot == null;
    }
    return true;
}

export default class Component {
    #props = new Proxy({}, {
        get: (_, prop: string) => {
            const node = components.get(this)!;
            if (prop in node.props) {
                return node.props[prop as keyof ComponentProps];
            }
            return undefined;
        }
    }) as ComponentProps;

    // Whether the component is a native DOM element or prefixed with `nn-`
    get native() {
        return false;
    }

    // Component properties getter
    get props() {
        return this.#props;
    }

    // Define child components here
    render() {}

    // Get child component by tag and optionally slot index
    query(tag: string, slot?: number): Component | null {
        const node = components.get(this)!;
        const kebabTag = toKebab(tag);

        // loop over direct children first
        for (const child of node.children) {
            const childNode = components.get(child)!;
            if (toKebab(childNode.tag) === kebabTag && (slot === undefined || childNode.props.slot === slot)) {
                return child;
            }
        }

        // then recursively search in children
        for (const child of node.children) {
            const found = child.query(tag, slot);
            if (found) {
                return found;
            }
        }

        return null;
    }

    // Append a component to its children.
    append(target: Component) {
        const node = components.get(this)!;

        if (node.props.innerHTML !== null && node.props.innerHTML !== undefined && node.props.innerHTML !== "") {
            console.warn("Component cannot have both innerHTML and children.");
            return;
        }

        const targetNode = components.get(target)!;

        if (targetNode.parent) {
            if (targetNode.source !== rendering) {
                console.warn("Component can only be moved from the same context as where it is created.");
                return;
            }
            // Remove from previous parent only if not created from render()
            const children = components.get(targetNode.parent)?.children;
            if (children?.includes(target)) {
                children.splice(children.indexOf(target), 1);
            }
        }
        
        if (rendering !== null) {
            // Match existing child if possible (only in a render() call)
            for (const child of node.children) {
                const childNode = components.get(child)!;
                // Match by source, tag and slot
                if (!resolved.has(child) && matched(childNode, targetNode)) {
                    resolved.add(child);
                    resolving.delete(child);

                    // match child elements
                    for (const targetChild of targetNode.children) {
                        if (components.get(targetChild)?.source === rendering) {
                            child.append(targetChild);
                        }
                    }

                    // update child props
                    tick(childNode.id, targetNode.props, null, null);

                    // Remove temporary component
                    tick(targetNode.id, {}, 'x', null);
                    return;
                }
            }
        }

        // create new child when no existing child match
        tick(targetNode.id, targetNode.props, node.id, (target.native ? 'nn-' : '') + toKebab(targetNode.tag));
    }

    // Remove a component and clear its references.
    unlink() {
        const node = components.get(this)!;
        if (node.source !== rendering) {
            console.warn("Component can only be unlinked from the same context as where it is created.");
        }
        else if (node.parent) {
            const children = components.get(node.parent)?.children;
            if (children?.includes(this)) {
                children.splice(children.indexOf(this), 1);
            }
            node.parent = null;
            if (rendering !== null) {
                resolved.add(this);
                resolving.delete(this);
            }
            tick(node.id, {}, 'x', null);
        }
    }

    // Remove a component but keep its reference.
    detach() {
        const node = components.get(this)!;
        if (node.source !== null || rendering !== null) {
            console.warn("Component cannot be detached inside a render() call.");
        }
        else if (node.parent) {
            const children = components.get(node.parent)?.children;
            if (children?.includes(this)) {
                children.splice(children.indexOf(this), 1);
            }
            node.parent = null;
            tick(node.id, {}, '-', null);
        }
    }
};

export function attachRoot(cmp: Component) {
    render(cmp);
    tick(components.get(cmp)!.id, {}, 'body', 'nn-' + toKebab(components.get(cmp)!.tag));
}