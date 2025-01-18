import { isCapatalized, toSnake } from "../utils";
import { Component } from "./component";
import { createFC } from "./dom";

/** Components defined before any extension is loaded. */
export const systemComponents = new Set<Capitalize<string>>();

/** Component constructors and function creators. */
const components = {} as UI;

/**
 * Define a component.
 * @param target Component class.
 * @param mode Permission of the component defition.
 */
export function defineComponent(target: typeof Component, mode: ComponentMode) {
    if (!isCapatalized(target.name)) {
        throw new Error(`Component name ${name} must be capatalized`);
    }

    if (target.name in components) {
        // extend existing component if mode is ROOT or GAME
        // and component is subclass of the existing component
        if ((mode === ComponentMode.ROOT ||
            (mode === ComponentMode.GAME && !systemComponents.has(target.name))) &&
            target.prototype instanceof components.get(target.name)!) { 
            components[target.name] = target;
            components[toSnake(target.name)] = createFC(target);
        }
        else {
            throw new Error(`Component ${target.name} already defined`);
        }
    }
    else {
        if (mode === ComponentMode.SYSTEM) {
            systemComponents.add(target.name);
        }
        components[target.name] = target;
        components[toSnake(target.name)] = createFC(target);
    }
}

/** Read-only UI getter for extensions. */
export const ui = new Proxy(components, {
    get: function(target, prop: Capitalize<string> | Uncapitalize<string>) {
        return target[prop];
    }
});
