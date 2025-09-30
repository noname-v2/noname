import { isDict, apply, toKebab } from "../utils";
import { elementProps, dimensionProps, nodeProps } from "../constants";
import type Server from './server';
import type Component from './component';
import { propsToElement } from "./css";

export default class Tree {
    // Component currently being rendered.
    #rendering: Component | null = null;

    // A sync() operation is in progress.
    #syncing = false;

    // Pending updates to be processed and sent to main thread
    #pending: Map<Component, ComponentUpdate> | null = null;

    // Newly created but not yet synced components
    // When deleted before sync(), no data needs to be sent to main thread
    #unsynced = new Set<Component>();

    // Rendered components under a component being re-rendered, to be deleted if not resolved
    #resolving = new Set<Component>();

    // Components already matched with a new Component from render()
    #resolved = new Set<Component>();

    // Reference to the Server instance
    #server: Server;

    get unsynced() {
        return this.#unsynced;
    }

    get resolving() {
        return this.#resolving;
    }

    get resolved() {
        return this.#resolved;
    }

    get rendering() {
        return this.#rendering;
    }

    constructor(server: Server) {
        this.#server = server;
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
        this.#server.lib.get(cmp, 'children')?.forEach((child: Component) => this.#unlink(child));

        // Clear its own references
        this.#server.lib.delete(cmp);
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
    #sync() {
        if (!this.#pending || this.#syncing) {
            return;
        }
        this.#server.logger.log("Syncing", this.#pending.size, "components");
        this.#syncing = true;

        // Components that have already been rendered in the current sync() call
        const rendered = new Set<Component>();

        while (true) {
            // Remove references to unlinked components
            const toUnlink = new Set<Component>();
            for (const [cmp, update] of this.#pending) {
                if (this.#server.lib.has(cmp) && update === 'x') {
                    toUnlink.add(cmp);
                }
            }
            for (const cmp of toUnlink) {
                this.#unlink(cmp);
            }

            // Find components that need to be rendered (created, moved or custom properties updated)
            const toRender = new Set<Component>();
            for (const [cmp, update] of this.#pending) {
                if (rendered.has(cmp) || !this.#server.lib.has(cmp)) {
                    continue;
                }
                if (typeof update === 'string') {
                    toRender.add(cmp);
                }
                else if (isDict(update)) {
                    // Remove unchanged property updates
                    this.#filterUpdate(this.#server.lib.get(cmp, 'props'), update);

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
            const id = this.#server.lib.id(cmp);
            if (update === 'x') {
                // Component deleted
                updates[id] = 'x';
            }
            else if (typeof update === 'string') {
                // Component moved or created
                const tagName = (this.#server.lib.ref(cmp)?.native ? '' : 'nn-') + toKebab(this.#server.lib.tag(cmp)!);
                updates[id] = [propsToElement(this.#server.lib.get(cmp, 'props'), this.#server.logger), update, tagName];
            }
            else if (isDict(update)) {
                // Component properties updated
                updates[id] = propsToElement(update, this.#server.logger);
            }
        }
        this.#server.channel.broadcast(updates);

        // Cleanup
        this.#pending = null;
        this.#syncing = false;
    }


    // Attach component to root element.
    createRoot(cmp: Component) {
        this.#server.channel.onmessage(msg => {
            if (Array.isArray(msg)) {
                // const [id, method, pos] = msg;
                // const node = components.get(id); // from here: using entities.get(id) after making Component a subclass of Entity
            }
        });
        this.tick(cmp, 'root');
    }

    // Schedule a component update
    tick(cmp: Component, update: ComponentUpdate) {
        if (this.#pending === null) {
            this.#pending = new Map();
            queueMicrotask(() => this.#sync());
        }
        if (this.#pending.has(cmp)) {
            // merge updates
            const current = this.#pending.get(cmp)!;
            if (update === 'x') {
                this.#pending.set(cmp, 'x');
            }
            else if (current === 'x') {
                this.#server.logger.warn("Component already marked for deletion, cannot update.");
            }
            else if (typeof update === 'string') {
                // Apply queued props change immediately since parent is changed
                if (isDict(current)) {
                    apply(this.#server.lib.get(cmp, 'props'), current);
                }
                this.#pending.set(cmp, update);
            }
            else if (typeof current === 'string') {
                // Update props directly if parent is changed
                if (isDict(update)) {
                    apply(this.#server.lib.get(cmp, 'props'), update);
                }
            }
            else if (isDict(current) && isDict(update)) {
                // Merge props update
                apply(current, update);
            }
            else {
                this.#server.logger.warn("Unknown update type: ", current, update);
            }
        }
        else {
            // Create a new update
            this.#pending.set(cmp, update);
        }
    }

    // Mark a component and its children as resolved / unresolved
    #unresolve(cmp: Component) {
        for (const child of this.#server.lib.get(cmp, 'children')) {
            if (this.#server.lib.get(child, 'source') === this.#rendering) {
                this.#resolving.add(cmp);
                this.#unresolve(child);
            }
        }
    }

    // Render a component by setting up context and calling its render() method
    #render(cmp: Component) {
        if (this.#rendering !== null || this.#resolved.size || this.#resolving.size) {
            this.#server.logger.warn("An component is already being rendered: " +
                this.#server.lib.tag(this.#rendering) + this.#server.lib.id(this.#rendering) + " <- " +
                this.#server.lib.tag(cmp) + this.#server.lib.id(cmp));
            return;
        }
        this.#server.logger.log("Rendering", this.#server.lib.tag(cmp), this.#server.lib.id(cmp));

        // Setup render environment
        this.#rendering = cmp;
        this.#unresolve(cmp);
        const n = this.#resolving.size;
        this.#server.lib.ref(cmp)?.render?.call(cmp, this.#server.lib.ui);

        // Remove outdated children
        for (const child of this.#resolving) {
            child.unlink();
        }

        // Cleanup
        if (this.#resolving.size || this.#resolved.size !== n) {
            this.#server.logger.warn(`Unmatched components after render(): ${this.#resolving.size} unresolved, ${this.#resolved.size} resolved, total ${n}`);
            this.#resolving.clear();
        }
        this.#resolved.clear();
        this.#rendering = null;
    }
}
