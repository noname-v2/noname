import { isDict, apply, toKebab } from "../utils";
import { elementProps, dimensionProps, nodeProps } from "../constants";
import type Server from './server';
import type Component from './component';
import type Library from "./library";
import { propsToElement } from "./css";

export default class Tree {
    // Component currently being rendered.
    #rendering: Component | null = null;

    // Root component
    #root!: Component;

    // A sync() operation is in progress.
    #syncing = false;

    // Pending updates to be processed and sent to main thread
    // string: Parent component ID of new / moved component, '-' if detached, 'x' if unlinked
    // ComponentProps: Update component properties
    #pending: Map<Component, string | ComponentProps> | null = null;

    // Newly created but not yet synced components
    // When deleted before sync(), no data needs to be sent to main thread
    #unsynced = new Set<Component>();

    // Rendered components under a component being re-rendered, to be deleted if not resolved
    #resolving = new Set<Component>();

    // Components already matched with a new Component from render()
    #resolved = new Set<Component>();

    // Set of components for client initialization
    #components = new Set<Component>();

    // Reference to the Server instance
    #server: Server;

    // UI object for creating components
    #ui: UI;

    // Reference to Library instance
    #lib: Library;

    // Getters for Component class
    get rendering() { return this.#rendering; }
    get unsynced() { return this.#unsynced; }
    get resolving() { return this.#resolving; }
    get resolved() { return this.#resolved; }

    // Getter for UI object for Server
    get ui() { return this.#ui; }

    constructor(server: Server, lib: Library) {
        this.#server = server;
        this.#lib = lib;
        this.#ui = new Proxy(lib.refs('component'), {
            get: (target, tag: string) => {
                if (!(tag in target)) {
                    target[tag] = { native: true };
                }
                return ((...args) => {
                    const cmp = lib.create('component', tag, this, lib, ...args);
                    this.#components.add(cmp);
                    return cmp;
                }) as UI[string];
            }
        });
    }

    // Clear references of a component and its children
    #unlink(cmp: Component) {
        if (this.#pending?.has(cmp)) {
            if (this.#unsynced.has(cmp)) {
                // If it has not been unsynced, avoid sending data to main thread
                this.#pending.delete(cmp);
            }
            else {
                // If it has been synced, make sure it is marked for deletion
                this.#pending.set(cmp, 'x');
            }
        }

        // Clear children's references recursively
        this.#lib.get(cmp, 'children')?.forEach((child: Component) => this.#unlink(child));

        // Clear its own references
        this.#lib.delete(cmp);
        this.#components.delete(cmp);
    }

    // Compare updates with current properties and remove unchanged entries
    #filterUpdate(update: ComponentProps, props: ComponentProps) {
        const toDelete = new Set<string>();
        for (const key in update) {
            if (isDict(props[key]) && isDict(update[key])) {
                this.#filterUpdate(update[key], props[key]);
            }
            else if (props[key] === update[key]) {
                toDelete.add(key);
            }
        }
        for (const key of toDelete) {
            delete update[key];
        }
    }

    // Process pending updates and send to main thread
    // Either scheduled by tick() for force synced by component.query().
    sync() {
        if (!this.#pending || this.#syncing) {
            return;
        }
        this.#server.log("Syncing", this.#pending.size, "components");
        this.#syncing = true;

        // Components that have already been rendered in the current sync() call
        const rendered = new Set<Component>();
        const lib = this.#lib;

        while (true) {
            // Remove references to unlinked components
            const toUnlink = new Set<Component>();
            for (const [cmp, update] of this.#pending) {
                if (lib.has(cmp) && update === 'x') {
                    toUnlink.add(cmp);
                }
            }
            for (const cmp of toUnlink) {
                this.#unlink(cmp);
            }

            // Find components that need to be rendered (created, moved or custom properties updated)
            const toRender = new Set<Component>();
            for (const [cmp, update] of this.#pending) {
                if (rendered.has(cmp) || !lib.has(cmp)) {
                    continue;
                }
                if (typeof update === 'string') {
                    toRender.add(cmp);
                }
                else if (isDict(update)) {
                    // Remove unchanged property updates
                    this.#filterUpdate(update, lib.get(cmp, 'props'));

                    // Render component if there are custom properties to update
                    for (const key in update) {
                        if (!(key in dimensionProps) && !(key in elementProps) && !(key in nodeProps)) {
                            toRender.add(cmp);
                            break;
                        }
                    }
                }
            }
            if (!toRender.size) {
                break;
            }

            // Render all queued components
            for (const cmp of toRender) {
                if (!rendered.has(cmp)) {
                    rendered.add(cmp);
                    this.#render(cmp);
                }
            }
        }

        // Sync to main thread
        const updates: ClientUpdate = {};
        for (const [cmp, update] of this.#pending) {
            const id = lib.id(cmp);
            if (update === 'x') {
                // Component deleted
                updates[id] = 'x';
            }
            else if (typeof update === 'string') {
                // Component moved or created
                const tagName = (lib.ref(cmp)?.native ? '' : 'nn-') + toKebab(lib.tag(cmp)!);
                updates[id] = [propsToElement(lib.get(cmp, 'props'), this.#server), update, tagName];
            }
            else if (isDict(update)) {
                // Component properties updated
                updates[id] = propsToElement(update, this.#server);
                apply(lib.get(cmp, 'props'), update);
            }
        }
        this.#server.broadcast(updates);

        // Cleanup
        this.#pending = null;
        this.#syncing = false;
    }

    init(id: string, css: string) {
        const msg: any = { css: css };
        const lib = this.#lib;
        for (const cmp of this.#components) {
            const tagName = (lib.ref(cmp)?.native ? '' : 'nn-') + toKebab(lib.tag(cmp)!);
            msg[lib.id(cmp)] = [propsToElement(lib.get(cmp, 'props'), this.#server), lib.id(lib.get(cmp, 'parent')) ?? '-', tagName];
            if (cmp === this.#root) {
                msg[lib.id(cmp)][1] = 'root';
            }
        }
        this.#server.log('Sending init data to', id, msg);
        this.#server.send(id, msg);
    }


    // Attach component to root element.
    createRoot(cmp: Component) {
        // this.#server.channel.onmessage(msg => {
        //     if (Array.isArray(msg)) {
        //         // const [id, method, pos] = msg;
        //         // const node = components.get(id); // from here: using entities.get(id) after making Component a subclass of Entity
        //     }
        // });
        this.#root = cmp;
        this.tick(cmp, 'root');
    }

    // Schedule a component update
    tick(cmp: Component, update: string | ComponentProps) {
        if (this.#pending === null) {
            this.#pending = new Map();
            queueMicrotask(() => this.sync());
        }
        if (this.#pending.has(cmp)) {
            // merge updates
            const current = this.#pending.get(cmp)!;
            if (update === 'x') {
                this.#pending.set(cmp, 'x');
            }
            else if (current === 'x') {
                this.#server.warn("Component already marked for deletion, cannot update.");
            }
            else if (typeof update === 'string') {
                // Apply queued props change immediately since parent is changed
                if (isDict(current)) {
                    apply(this.#lib.get(cmp, 'props'), current);
                }
                this.#pending.set(cmp, update);
            }
            else if (typeof current === 'string') {
                // Update props directly if parent is changed
                if (isDict(update)) {
                    apply(this.#lib.get(cmp, 'props'), update);
                }
            }
            else if (isDict(current) && isDict(update)) {
                // Merge props update
                apply(current, update);
            }
            else {
                this.#server.warn("Unknown update type: ", current, update);
            }
        }
        else {
            // Create a new update
            this.#pending.set(cmp, update);
        }
    }

    // Mark a component and its children as resolved / unresolved
    #unresolve(cmp: Component) {
        for (const child of this.#lib.get(cmp, 'children')) {
            if (this.#lib.get(child, 'source') === this.#rendering) {
                this.#resolving.add(child);
                this.#unresolve(child);
            }
        }
    }

    // Render a component by setting up context and calling its render() method
    #render(cmp: Component) {
        const lib = this.#lib;
        if (this.#rendering !== null || this.#resolved.size || this.#resolving.size) {
            this.#server.warn("An component is already being rendered: " +
                lib.tag(this.#rendering) + lib.id(this.#rendering) + " <- " +
                lib.tag(cmp) + lib.id(cmp));
            return;
        }
        this.#server.log("Rendering", lib.tag(cmp), lib.id(cmp));

        // Setup render environment
        this.#rendering = cmp;
        this.#unresolve(cmp);
        const n = this.#resolving.size;
        const children = lib.ref(cmp)?.render?.call(lib.get(cmp, 'props'), this.#ui);
        if (Array.isArray(children)) {
            cmp.append(...children);
        }
        else if (children) {
            cmp.append(children!);
        }

        // Remove outdated children
        for (const child of this.#resolving) {
            child.unlink();
        }

        // Cleanup
        if (this.#resolving.size || this.#resolved.size !== n) {
            this.#server.warn(`Unmatched components after render(): ${this.#resolving.size} unresolved, ${this.#resolved.size} resolved, total ${n}`);
            this.#resolving.clear();
        }
        this.#resolved.clear();
        this.#rendering = null;
    }
}
