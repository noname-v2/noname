import { isDict, apply } from "../utils";
import logger from '../logger';
import type Server from './server';

// ID of the next component to be created.
let nextId = 1;

// Component currently being rendered.
let rendering: Component | null = null;

// A sync() operation is in progress.
let syncing = false;

// Pending updates to be processed and sent to main thread
let pending: Map<Component, ComponentUpdate> | null = null;

// Function to send data to main thread
let server: Server;

// Component data storage
export const components = new WeakMap<Component, ComponentNode>();

// Newly created but not yet synced components
// When deleted before sync(), no data needs to be sent to main thread
export const unsynced = new Set<Component>();

// Rendered components under a component being re-rendered, to be deleted if not resolved
export const resolving = new Set<Component>();

// Components already matched with a new Component from render()
export const resolved = new Set<Component>();

const dimensionPropKeys = new Set([
    'left', 'top', 'right', 'bottom', 'width', 'height', 'aspectRatio'
]);

const elementPropKeys = new Set([
    'style', 'dataset', 'className', 'innerHTML',
    'x', 'y', 'z', 'opacity',
    'scale', 'scaleX', 'scaleY', 'scaleZ',
    'rotate', 'rotateX', 'rotateY', 'rotateZ',
    'transition', 'down'
]);

const componentPropKeys = new Set([
    ...elementPropKeys,
    ...dimensionPropKeys,
    'exclusive', 'slot', 'onClick'
]);

// Clear references of a component and its children
function unlink(cmp: Component) {
    if (pending?.has(cmp)) {
        if (unsynced.has(cmp)) {
            // If it has not been unsynced, avoid sending data to main thread
            pending.delete(cmp);
        }
        else {
            // If it has been synced, make sure it is marked for deletion
            pending.set(cmp, 'x');
        }
    }

    // Clear children's references recursively
    components.get(cmp)?.children.forEach(child => unlink(child));

    // Clear its own references
    components.delete(cmp);
}

// Compare updates with current properties and remove unchanged entries
function filterUpdate(update: ComponentProps, props: ComponentProps) {
    const toDelete = new Set<string>();
    for (const key in update) {
        if (isDict(props[key]) && isDict(update[key])) {
            filterUpdate(update[key], props[key]);
        }
        else if (props[key] === update[key]) {
            toDelete.add(key);
        }
    }
    for (const key of toDelete) {
        delete update[key];
    }
}

// Convert aspect ratio to CSS style string
function toRatioString(value: any): string {
    if (typeof value === 'number') {
        return value.toString();
    }
    if (Array.isArray(value) && value.length === 2) {
        return `${value[0]} / ${value[1]}`;
    }
    if (typeof value === 'string') {
        return value;
    }
    return '';
}

// Convert number, string or [number, number] to CSS style string
function toDimensionString(value: any): string {
    if (typeof value === 'number') {
        return value + 'px';
    }
    if (Array.isArray(value) && value.length === 2) {
        const dval = value[1] > 0 ? `+ ${value[1]}px` : `- ${-value[1]}px`;
        return `calc(${value[0]}% ${dval})`;
    }
    if (typeof value === 'string') {
        return value;
    }
    return '';
}

// Convert ComponentProps to ElementProps
function propsToElement(props: ComponentProps): ElementProps {
    const eprops = {} as any;
    
    // Copy properties that do not need conversion first
    for (const key in props) {
        if (elementPropKeys.has(key)) {
            eprops[key] = props[key];
        }
    }

    for (const key in props) {
        const value = props[key];
        if (dimensionPropKeys.has(key)) {
            // Convert component properties to CSS styles
            eprops.style ??= {};
            if (key in eprops.style) {
                logger.warn("Overriding existing style." + key);
            }
            eprops.style[key] = key === 'aspectRatio' ? toRatioString(value) : toDimensionString(value);
        }
        else if (key === 'onClick' && typeof props[key] === 'string') {
            // Convert onClick property to click event listener
            eprops.click = true;
        }
    }
    return eprops;
}

// Process pending updates and send to main thread
function sync() {
    if (!pending || syncing) {
        return;
    }
    logger.log("Syncing", pending.size, "components");
    syncing = true;

    // Components that have already been rendered in the current sync() call
    const rendered = new Set<Component>();

    while (true) {
        // Remove references to unlinked components
        const toUnlink = new Set<Component>();
        for (const [cmp, update] of pending) {
            if (components.has(cmp) && update === 'x') {
                toUnlink.add(cmp);
            }
        }
        for (const cmp of toUnlink) {
            unlink(cmp);
        }

        // Find components that need to be rendered (created, moved or custom properties updated)
        const toRender = new Set<Component>();
        for (const [cmp, update] of pending) {
            if (rendered.has(cmp) || !components.has(cmp)) {
                continue;
            }
            if (typeof update === 'string') {
                toRender.add(cmp);
            }
            else if (isDict(update)) {
                // Remove unchanged property updates
                filterUpdate(components.get(cmp)!.props, update);

                // Render component if there are custom properties to update
                for (const key in update) {
                    if (!componentPropKeys.has(key)) {
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
                render(cmp);
            }
        }
    }

    // Sync to main thread
    const updates: ClientUpdate = {};
    for (const [cmp, update] of pending) {
        const node = components.get(cmp)!;
        const id = node.id;
        if (update === 'x') {
            // Component deleted
            updates[id] = 'x';
        }
        else if (typeof update === 'string') {
            // Component moved or created
            updates[id] = [propsToElement(components.get(cmp)!.props), update, node.tag];
        }
        else if (isDict(update)) {
            // Component properties updated
            updates[id] = propsToElement(update);
        }
    }
    server.broadcast(updates);

    // Cleanup
    pending = null;
    syncing = false;
}

// Attach component to root element.
export function createRoot(cmp: Component, target: Server) {
    server = target;
    tick(cmp, 'root');
}

// Send a config update
export function config(update: ConfigUpdate) {
    server.broadcast(update);
}

// Schedule a component update
export function tick(cmp: Component, update: ComponentUpdate) {
    if (pending === null) {
        pending = new Map();
        queueMicrotask(sync);
    }
    if (pending.has(cmp)) {
        // merge updates
        const node = components.get(cmp)!;
        const current = pending.get(cmp)!;
        if (update === 'x') {
            pending.set(cmp, 'x');
        }
        else if (current === 'x') {
            logger.warn("Component already marked for deletion, cannot update.");
        }
        else if (typeof update === 'string') {
            // Apply queued props change immediately since parent is changed
            if (isDict(current)) {
                apply(node.props, current);
            }
            pending.set(cmp, update);
        }
        else if (typeof current === 'string') {
            // Update props directly if parent is changed
            if (isDict(update)) {
                apply(node.props, update);
            }
        }
        else if (isDict(current) && isDict(update)) {
            // Merge props update
            apply(current, update);
        }
        else {
            logger.warn("Unknown update type: ", current, update);
        }
    }
    else {
        // Create a new update
        pending.set(cmp, update);
    }
}

// Get the component currently being rendered
export function getRendering() {
    return rendering;
}

// Data wrapper for component properties
export class ComponentNode {
    id = (nextId++).toString(); // unique component ID
    tag: string // Component class name, e.g. "App"
    children: Component[] = []; // Child components added by this.append()
    parent: Component | null = null; // Parent component
    source: Component | null = rendering; // Source component with the render() method that creates this component
    props: ComponentProps = {}; // Component data
    onclick: ClickCallback | null = null; // Click event handler

    constructor(tag: string) {
        this.tag = tag;
    }

    // TODO: Convert to Plain
    flatten() { }
}

// Mark a component and its children as resolved / unresolved
function unresolve(cmp: Component) {
    for (const child of components.get(cmp)!.children) {
        if (components.get(child)!.source === rendering) {
            resolving.add(cmp);
            unresolve(child);
        }
    }
}

function render(cmp: Component) {
    if (rendering !== null || resolved.size || resolving.size) {
        logger.warn("An component is already being rendered: " + components.get(rendering!) + " <- " + components.get(cmp));
        return;
    }
    logger.log("Rendering", components.get(cmp));

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
        logger.warn(`Unmatched components after render(): ${resolving.size} unresolved, ${resolved.size} resolved, total ${n}`);
        resolving.clear();
    }
    resolved.clear();
    rendering = null;
}
