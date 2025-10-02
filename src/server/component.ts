import translate from "./locale";
import { isDict, apply } from "../utils";
import type Server from "./server";

// From here: consider only keeping base Component and Stage class?
// Component callbacks only have two types:
// 1) determined by current Stage
// 2) create a popup menu
// 3) update a component state (e.g. sort cards, pre-trigger skills)
// callback(true) -> execute callback determined by current Stage
// callback('popup') -> show popup menu defined in component definition
// callback({sort:'auto'}, true) -> state.sort = 'auto' -> set sort mode to auto and trigger re-render
// callback({sort:[1,3,5,2,4]}, false) -> state.sort = [1,3,5,2,4] -> manually set card order and do not trigger re-render
// interface ComponentDefinition {
// render: () => void;
// command?: () => void;
// css?: CSSDict;
// mixin?: string[];
// native?: boolean;
// }

export default class Component {
    #data: {
        props: ComponentProps;
        children: Component[];
        parent: Component | null;
        source: Component | null;
    };

    // Reference to the Server instance
    #server: Server;

    constructor({ data, init, ui, server }: EntityAPI,
        ...args: (string | number | Component | Component[] | Partial<ComponentProps>)[]) {
        // Initialize component properties
        this.#data = data;
        this.#server = server;

        if (init(this)) {
            // Restored from saved state and does not need initialization
            return;
        }

        // Initialize component data
        data.props = {};
        data.children = [];
        data.parent = null;
        data.source = server.tree.rendering;

        // Label that the component is not yet synced to clients
        server.tree.unsynced.add(this);
        server.tree.tick(this, '-')

        // Process arguments
        for (const arg of args) {
            if (arg instanceof Component) {
                // Append arg as child component
                this.append(arg);
            }
            else if (Array.isArray(arg)) {
                // Append arg as child components
                for (const item of arg) {
                    this.append(item);
                }
            }
            else if (isDict(arg)) {
                // Assign component properties
                apply(data.props, arg);
            }
            else if (typeof arg === "string") {
                // Append text node
                this.append(ui.span({ innerHTML: translate(arg) }));
            }
            else if (typeof arg === "number") {
                // Slot index, to be handled by parent component
                data.props.slot = arg;
            }
        }

        if (data.props.innerHTML && data.children.length > 0) {
            server.warn("Component cannot have both innerHTML and children, removing innerHTML.");
            data.props.innerHTML = null;
        }
    }

    // Get child component by tag and optionally slot index
    query(tag: string, slot?: number): Component | null {
        // loop over direct children first
        for (const child of this.#data.children) {
            if (this.#server.lib.tag(child) === tag && (slot === undefined || this.#server.lib.get(child, 'props').slot === slot)) {
                return child;
            }
        }

        // then recursively search in children
        for (const child of this.#data.children) {
            const found = child.query(tag, slot);
            if (found) {
                return found;
            }
        }

        return null;
    }

    // Append a component to its children.
    append(...targets: Component[]) {
        for (const target of targets) {
            this.#append(target);
        }
    }

    // Append a component to its children (single target).
    #append(target: Component) {
        const lib = this.#server.lib;
        const tree = this.#server.tree;
        this.#server.log("Appending component", lib.id(target), "to", lib.id(this));
        const rendering = tree.rendering;

        if (this.#data.props.innerHTML) {
            this.#server.warn("Component cannot have both innerHTML and children, skipping append().");
            return;
        }

        if (target.#data.parent) {
            if (target.#data.source !== rendering) {
                this.#server.warn("Component can only be moved from the same context as where it is created.", this, target);
                return;
            }
            // Remove from previous parent only if created from the same render() context
            const children = lib.get(lib.get(target, 'parent'), 'children');
            if (children.includes(target)) {
                children.splice(children.indexOf(target), 1);
            }
        }

        if (rendering !== null) {
            // Match existing child if possible (only in a render() context)
            for (const child of this.#data.children) {
                // Match by source, tag and slot
                if (tree.resolving.has(child) && !tree.resolved.has(child) && this.#match(child, target)) {
                    tree.resolved.add(child);
                    tree.resolving.delete(child);

                    // match child elements
                    for (const targetChild of lib.get(target, 'children')) {
                        if (lib.get(targetChild, 'source') === rendering) {
                            child.append(targetChild);
                        }
                    }

                    // update child props
                    tree.tick(child, target.#data.props);

                    // Remove temporary component
                    tree.tick(target, 'x');
                    this.#server.log(`Reusing component <${lib.tag(child)}> id=${lib.id(child)}`);
                    return;
                }
            }
        }

        // create new child when no existing child match
        tree.tick(target, lib.id(this));
        this.#data.children.push(target);
        lib.set(target, 'parent', this);
    }

    // Remove a component and clear its references.
    unlink() {
        if (this.#detach()) {
            if (this.#server.tree.resolving.has(this)) {
                this.#server.tree.resolved.add(this);
                this.#server.tree.resolving.delete(this);
            }
            this.#server.tree.tick(this, 'x');
        }
    }

    // Remove a component but keep its reference.
    detach() {
        if (this.#detach()) {
            this.#server.tree.tick(this, '-');
        }
    }

    // Update component properties.
    update(update: ComponentProps) {
        this.#server.tree.tick(this, update);
    }

    // Set component property
    set(key: string, value: any) {
        this.update({ [key]: value });
    }

    // Get component property
    get(key: string) {
        return this.#data.props[key];
    }

    // Remove reference from parent
    #detach() {
        const rendering = this.#server.tree.rendering;
        if (this.#data.source !== rendering) {
            this.#server.warn("Component can only be detached from the same context as where it is created", this, rendering);
            return false;
        }
        if (this.#data.parent) {
            const children = this.#server.lib.get(this.#data.parent, 'children');
            if (children.includes(this)) {
                children.splice(children.indexOf(this), 1);
            }
            this.#data.parent = null;
        }
        return true;
    }

    // Check if a new component matches an existing one
    #match(a: Component, b: Component) {
        // Check constructor
        const lib = this.#server.lib;
        if (lib.tag(a) !== lib.tag(b)) {
            return false;
        }

        // Check the render() method that created the component
        if (lib.get(a, 'source') !== lib.get(b, 'source')) {
            return false;
        }

        // Check slots, slotA === slotB or both null/undefined
        if (lib.get(a, 'props').slot !== lib.get(b, 'props').slot) {
            return lib.get(a, 'props').slot == null && lib.get(b, 'props').slot == null;
        }

        return true;
    }
};
