import { isCapatalized, unCapitalize } from "../utils";
import Component from "./component";
import { createFC } from "./dom";

export function createUI() {
    /** Components defined in the current scope. */
    const components = { Component } as UI;

    /**
     * Define a component.
     * @param target Component class.
     * @param mode Permission of the component defition.
     */
    const defineComponent = (name: string, creator: ComponentExtension) => {
        if (!isCapatalized(name)) {
            throw new Error(`Component name ${name} must be capatalized`);
        }

        const target = creator(ui);

        if (name in components) {
            // extend existing component if applicable
            if (target.prototype instanceof components[name]) {
                components[name] = target;
                components[unCapitalize(name)] = createFC(target);
            }
            else {
                throw new Error(`Component ${name} already defined`);
            }
        }
        else {
            components[name] = target;
            components[unCapitalize(name)] = createFC(target);
        }
    }

    /** Read-only UI getter for extensions. */
    const ui = new Proxy(components, {
        get: function (target, prop: Capitalize<string> | Uncapitalize<string>) {
            return target[prop];
        }
    });

    return { ui, defineComponent };
}

export const { ui, defineComponent } = createUI();
