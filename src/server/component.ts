import { isDict, apply } from "../utils";
import translate from "./locale";

// Component data storage
const components = new WeakMap<Component, ComponentNode>();

// ID of the next component to be created.
let nextId = 1;

// UI updates pending to be sent to main thread
interface ComponentUpdate extends ElementUpdate {
    props?: ComponentProps;
}

let pending: ComponentUpdate[] | null = [];

// Process pending updates and send to main thread
function sync() {

}

// Schedule a component update
function tick(update: ComponentUpdate) {
    if (pending === null) {
        pending = [];
        queueMicrotask(sync);
    }
    pending.push(update);
}

// Default component layout properties
const defaultLayout = {
    opacity: 1,
    x: 0,
    y: 0,
    z: 0,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    rotate: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    left: null,
    top: null,
    right: null,
    bottom: null,
    width: null,
    height: null,
    aspectRatio: null
};

// Data wrapper for component properties
class ComponentNode {
    id = nextId++; // unique component ID
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

export function render(cmp: Component) {
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
        child.remove();
    }

    // Cleanup
    if (resolving.size || resolved.size !== n) {
        console.warn(`Unmatched components after render(): ${resolving.size} unresolved, ${resolved.size} resolved, total ${n}`);
    }
    resolving.clear();
    resolved.clear();
}

// Create a function for making component instances
export function getMaker(tag: string, cls: ComponentType, ui: UI): ComponentMaker {
    return (...args) => {
        const cmp = new cls();
        const node = new ComponentNode(tag);

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

    // Render component, defaults to creating an empty element.
    render() {

    }

    // Get child component by tag and optionally slot index
    query(tag: string, slot?: number): Component {
        return this;
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
            if (rendering !== null || targetNode.source !== null) {
                console.warn("Cannot move component created from render(), create a new one instead.");
                return;
            }
            // Remove from previous parent only if not created from render()
            const children = components.get(targetNode.parent)?.children;
            if (children?.includes(target)) {
                children.splice(children.indexOf(target), 1);
            }
            tick({ u: targetNode.id, p: node.id, props: targetNode.props });
        }
        else if (rendering !== null) {
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
                    tick({ u: childNode.id, props: targetNode.props });
                    return;
                }
            }
        }
        else {
            // create new child when no existing child match
            tick({ u: targetNode.id, t: targetNode.tag, p: node.id, props: targetNode.props });
        }
    }

    // Remove a component from its parent.
    remove() {
        const node = components.get(this)!;
        if (node.source !== rendering) {
            console.warn("Component can only be removed from the same context as where it is created.");
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
            tick({ u: node.id, p: -1 });
        }
    }
};