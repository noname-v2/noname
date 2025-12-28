import translate from "./locale";
import { isDict, apply } from "../utils";
import type Server from "./server";
import type Tree from "./tree";
import type Library from "./library";

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

// ui.xxx() inside render() should create a ComponentFragment object instead of a full component
// A component should store the full tree created by the render() method of the subcomponents and no sub-component should be stored
// A component can optionally define where the children is located by assigning {slot: '#'} in propsY

// Remove componentProps from constructor args and use cmp.x(), cmp.y(), cmp.css(), etc. instead
// Make component linkable to another entity for prop updates
// Components are no longer directly referenced, but controlled by their linked entities
// Implement temporary component updates that are cleared after current stage (for animation)

/**
 * Return value of ui.xxx() functions that holds component creation arguments for rendering.
 * Used internally by Component.render() to create child components.
 */
export default class Component {
    // Configuration dict
    #config: Dict;

    // Child components
    #children: Component[];

    // Tag name of the component
    #tag: string;

    get config() {
        return this.#config;
    }

    get children() {
        return this.#children;
    }

    get tag() {
        return this.#tag;
    }

    constructor(tag: string, ...args: (string | Component | Component[] | Dict)[]) {
        this.#config = {};
        this.#children = [];
        this.#tag = tag;

        for (const arg of args) {
            if (arg instanceof Component) {
                this.#children.push(arg);
            }
            else if (Array.isArray(arg)) {
                for (const item of arg) {
                    if (item instanceof Component) {
                        this.#children.push(item);
                    }
                }
            }
            else if (isDict(arg)) {
                apply(this.#config, arg);
            }
        }
    }
}

// export default class Component {
//     #data: {
//         props: ComponentProps;
//         children: Component[];
//         parent: Component | null;
//         source: Component | null;
//         link?: any; // Link to an entity (e.g. card, skill)
//     };

//     // Reference to the Server instance
//     #server: Server;

//     // Reference to the Tree instance
//     #tree: Tree;

//     // Reference to the Library instance
//     #lib: Library;

//     constructor({ data, init, server }: EntityAPI, tree: Tree, lib: Library,
//         ...args: (string | number | Component | Component[] | Partial<ComponentProps>)[]) {
//         // Initialize component properties
//         this.#data = data;
//         this.#server = server;
//         this.#tree = tree;
//         this.#lib = lib;

//         if (init(this)) {
//             // Restored from saved state and does not need initialization
//             return;
//         }

//         // Initialize component data
//         data.props = {};
//         data.children = [];
//         data.parent = null;
//         data.source = tree.rendering;

//         // Label that the component is not yet synced to clients
//         tree.unsynced.add(this);
//         tree.tick(this, '-')

//         // Process arguments
//         for (const arg of args) {
//             if (arg instanceof Component) {
//                 // Append arg as child component
//                 this.append(arg);
//             }
//             else if (Array.isArray(arg)) {
//                 // Append arg as child components
//                 for (const item of arg) {
//                     this.append(item);
//                 }
//             }
//             else if (isDict(arg)) {
//                 // Assign component properties
//                 apply(data.props, arg);
//             }
//             else if (typeof arg === "string") {
//                 // Append text node
//                 server.log('Appending text node:', translate(arg));
//                 this.append(server.ui.span({ innerHTML: translate(arg) }));
//             }
//             else if (typeof arg === "number") {
//                 // Slot index, to be handled by parent component
//                 data.props.slot = arg;
//             }
//         }

//         if (data.props.innerHTML && data.children.length > 0) {
//             server.warn("Component cannot have both innerHTML and children, removing innerHTML.");
//             data.props.innerHTML = null;
//         }
//     }

//     // Get child component by tag and optionally slot index
//     query(tag: string, slot?: number): Component | null {
//         // Ensure component up-to-date
//         this.#tree.sync();

//         // loop over direct children first
//         for (const child of this.#data.children) {
//             if (this.#lib.tag(child) === tag && (slot === undefined || this.#lib.get(child, 'props').slot === slot)) {
//                 return child;
//             }
//         }

//         // then recursively search in children
//         for (const child of this.#data.children) {
//             const found = child.query(tag, slot);
//             if (found) {
//                 return found;
//             }
//         }

//         return null;
//     }

//     // Append a component to its children.
//     append(...targets: Component[]) {
//         for (const target of targets) {
//             this.#append(target);
//         }
//     }

//     // Append a component to its children (single target).
//     #append(target: Component) {
//         const lib = this.#lib;
//         const tree = this.#tree;
//         this.#server.log("Appending component", lib.id(target), "to", lib.id(this));
//         const rendering = tree.rendering;

//         if (this.#data.props.innerHTML) {
//             this.#server.warn("Component cannot have both innerHTML and children, skipping append().");
//             return;
//         }

//         if (lib.get(target, 'parent')) {
//             if (lib.get(target, 'source') !== rendering) {
//                 this.#server.warn("Component can only be moved from the same context as where it is created.", this, target);
//                 return;
//             }
//             // Remove from previous parent only if created from the same render() context
//             const children = lib.get(lib.get(target, 'parent'), 'children');
//             if (children.includes(target)) {
//                 children.splice(children.indexOf(target), 1);
//             }
//         }

//         if (rendering !== null) {
//             // Match existing child if possible (only in a render() context)
//             for (const child of this.#data.children) {
//                 // Match by source, tag and slot
//                 if (tree.resolving.has(child) && !tree.resolved.has(child) && this.#match(child, target)) {
//                     tree.resolved.add(child);
//                     tree.resolving.delete(child);

//                     // match child elements
//                     this.#server.log(`Reusing component <${lib.tag(child)}> id=${lib.id(child)} for appended <${lib.tag(target)}> id=${lib.id(target)}`);

//                     for (const targetChild of lib.get(target, 'children')) {
//                         if (lib.get(targetChild, 'source') === rendering) {
//                             child.append(targetChild);
//                         }
//                     }

//                     // update child props
//                     tree.tick(child, lib.get(target, 'props'));

//                     // Remove temporary component
//                     tree.tick(target, 'x');
//                     return;
//                 }
//             }
//         }

//         // create new child when no existing child match
//         tree.tick(target, lib.id(this));
//         this.#data.children.push(target);
//         lib.set(target, 'parent', this);
//     }

//     // Remove a component and clear its references.
//     unlink() {
//         if (this.#detach()) {
//             if (this.#tree.resolving.has(this)) {
//                 this.#tree.resolved.add(this);
//                 this.#tree.resolving.delete(this);
//             }
//             this.#tree.tick(this, 'x');
//         }
//     }

//     // Remove a component but keep its reference.
//     detach() {
//         if (this.#detach()) {
//             this.#tree.tick(this, '-');
//         }
//     }

//     // Update component properties.
//     update(update: ComponentProps) {
//         this.#tree.tick(this, update);
//     }

//     // Set component property
//     set(key: string, value: any) {
//         this.update({ [key]: value });
//     }

//     // Get component property
//     get(key: string) {
//         return this.#data.props[key];
//     }

//     // Remove reference from parent
//     #detach() {
//         const rendering = this.#tree.rendering;
//         if (this.#data.source !== rendering) {
//             this.#server.warn("Component can only be detached from the same context as where it is created ",
//                 this.#lib.tag(this), this.#lib.id(this), this.#lib.tag(this.#data.source), this.#lib.id(this.#data.source), this.#lib.tag(rendering), this.#lib.id(rendering));
//             return false;
//         }
//         if (this.#data.parent) {
//             const children = this.#lib.get(this.#data.parent, 'children');
//             if (children.includes(this)) {
//                 children.splice(children.indexOf(this), 1);
//             }
//             this.#data.parent = null;
//         }
//         return true;
//     }

//     // Check if a new component matches an existing one
//     #match(a: Component, b: Component) {
//         // Check constructor
//         const lib = this.#lib;
//         if (lib.tag(a) !== lib.tag(b)) {
//             return false;
//         }

//         // Check the render() method that created the component
//         if (lib.get(a, 'source') !== lib.get(b, 'source')) {
//             return false;
//         }

//         // Check slots, slotA === slotB or both null/undefined
//         if (lib.get(a, 'props').slot !== lib.get(b, 'props').slot) {
//             return lib.get(a, 'props').slot == null && lib.get(b, 'props').slot == null;
//         }

//         return true;
//     }
// };
