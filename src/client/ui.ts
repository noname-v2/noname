import { isCapatalized, unCapitalize } from "../utils";
import { Component } from "./component";
import { createFC } from "./dom";

/** Components defined before any extension is loaded. */
const systemComponents = new Set<Capitalize<string>>();

/** Component constructors and function creators. */
const components = {} as UI;

/**
 * Define a component.
 * @param target Component class.
 * @param mode Permission of the component defition.
 */
function defineComponent(target: typeof Component) {
    if (!isCapatalized(target.name)) {
        throw new Error(`Component name ${target.name} must be capatalized`);
    }

    if (target.name in components) {
        // extend existing component if
        // 1) mode is ROOT, or
        // 2) mode is GAME and target is not a system component
        // and component is subclass of the existing component
        if (target.prototype instanceof components[target.name]) { 
            components[target.name] = target;
            components[unCapitalize(target.name)] = createFC(target);
        }
        else {
            throw new Error(`Component ${target.name} already defined`);
        }
    }
    else {
        components[target.name] = target;
        components[unCapitalize(target.name)] = createFC(target);
    }
}

/**
 * Define a component from components folder or an extension.
 * @param creator Component creator function that returns an array of component classes.
 */
export function defineComponents(creator: ComponentExtension, root: boolean) {
    for (const target of creator(ui)) {
        defineComponent(target);
        if (root) {
            systemComponents.add(target.name as Capitalize<string>);
        }
    }
}

/** Read-only UI getter for extensions. */
export const ui = new Proxy(components, {
    get: function(target, prop: Capitalize<string> | Uncapitalize<string>) {
        return target[prop];
    }
});

defineComponent(Component);
