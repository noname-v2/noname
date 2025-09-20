import translate from "./locale";
import logger from '../logger';
import { toKebab, isDict, apply } from "../utils";
import { components, resolving, resolved, unsynced, tick, getRendering, ComponentNode } from './tree';

// Check if a new component matches an existing one
function matchComponent(a: ComponentNode, b: ComponentNode) {
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

// Create a function for making component instances
export function getMaker(tag: string, cls: ComponentType, ui: ExtensionAPI['ui']): ComponentMaker {
    return (...args) => {
        const cmp = new cls();
        const node = new ComponentNode((cls.native ? 'nn-' : '') + toKebab(tag));
        components.set(cmp, node);
        unsynced.add(cmp);
        tick(cmp, '-')
        logger.log(`Creating component <${node.tag}> id=${node.id}`);

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

        if (node.props.innerHTML !== null && node.props.innerHTML !== undefined && node.props.innerHTML !== "" && node.children.length > 0) {
            logger.warn("Component cannot have both innerHTML and children, removing innerHTML.");
            node.props.innerHTML = "";
        }

        return cmp;
    };
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

    // Default CSS styles
    static css: Dict = {
        display: 'block',
        position: 'absolute'
    };

    // Whether the component is a native DOM element or prefixed with `nn-`
    static native = false;

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
            if (childNode.tag === kebabTag && (slot === undefined || childNode.props.slot === slot)) {
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
        const rendering = getRendering();

        if (node.props.innerHTML !== null && node.props.innerHTML !== undefined && node.props.innerHTML !== "") {
            logger.warn("Component cannot have both innerHTML and children, skipping append().");
            return;
        }

        const targetNode = components.get(target)!;

        if (targetNode.parent) {
            if (targetNode.source !== rendering) {
                logger.warn("Component can only be moved from the same context as where it is created.", node, targetNode);
                return;
            }
            // Remove from previous parent only if created from the same render() context
            const children = components.get(targetNode.parent)?.children;
            if (children?.includes(target)) {
                children.splice(children.indexOf(target), 1);
            }
        }

        if (rendering !== null) {
            // Match existing child if possible (only in a render() context)
            for (const child of node.children) {
                const childNode = components.get(child)!;
                // Match by source, tag and slot
                if (!resolved.has(child) && matchComponent(childNode, targetNode)) {
                    resolved.add(child);
                    resolving.delete(child);

                    // match child elements
                    for (const targetChild of targetNode.children) {
                        if (components.get(targetChild)?.source === rendering) {
                            child.append(targetChild);
                        }
                    }

                    // update child props
                    tick(child, targetNode.props);

                    // Remove temporary component
                    tick(target, 'x');
                    logger.log(`Reusing component <${childNode.tag}> id=${childNode.id}`);
                    return;
                }
            }
        }

        // create new child when no existing child match
        tick(target, node.id);
        node.children.push(target);
        targetNode.parent = this;
    }

    // Remove a component and clear its references.
    unlink() {
        if (this.#detach()) {
            if (resolving.has(this)) {
                resolved.add(this);
                resolving.delete(this);
            }
            tick(this, 'x');
        }   
    }

    // Remove a component but keep its reference.
    detach() {
        if (this.#detach()) {
            tick(this, '-');
        }
    }

    // Remove reference from parent
    #detach() {
        const node = components.get(this)!;
        const rendering = getRendering();
        if (node.source !== rendering) {
            logger.warn("Component can only be detached from the same context as where it is created", node, components.get(rendering!) ?? null);
            return false;
        }
        if (node.parent) {
            const children = components.get(node.parent)?.children;
            if (children?.includes(this)) {
                children.splice(children.indexOf(this), 1);
            }
            node.parent = null;
        }
        return true;
    }
};
