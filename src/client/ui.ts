import { isCapatalized, toSnake } from "../utils";
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
export function defineComponent(target: typeof Component, mode: ComponentMode) {
    if (!isCapatalized(target.name)) {
        throw new Error(`Component name ${target.name} must be capatalized`);
    }

    if (target.name in components) {
        // extend existing component if
        // 1) mode is ROOT, or
        // 2) mode is GAME and target is not a system component
        // and component is subclass of the existing component
        if ((mode === ComponentMode.ROOT ||
            (mode === ComponentMode.GAME && !systemComponents.has(target.name))) &&
            target.prototype instanceof components[target.name]) { 
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

export function defineComponents(components: Dict<typeof Component>, mode: ComponentMode) {
    for (const key in components) {
        defineComponent(components[key], mode);
    }
}

/** Read-only UI getter for extensions. */
export const ui = new Proxy(components, {
    get: function(target, prop: Capitalize<string> | Uncapitalize<string>) {
        return target[prop];
    }
});
