import { isCapatalized, unCapitalize } from "../utils";

// map from component to its parent
const parent = new Map<Component, Component>();

// map from component to child components
const children = new Map<Component, Component[]>();

// newly created components to be processed
const incoming = new Set<Component>();

// components passed by wrapComponent(), to be processed by the render() method of a certain component
const appended = new Map<Component, Component[]>();

function wrapComponent(target: ComponentType): ComponentCreator {
    return (...args) => {
        const cmp = new target();
        incoming.add(cmp);

        for (const arg of args) {
            if (arg instanceof Component) {
                if (!incoming.has(arg)) {
                    throw new Error("Unexpected child component.");
                }
                incoming.delete(cmp);
                if (!appended.has(cmp)) {
                    appended.set(cmp, []);
                }
                appended.get(cmp)!.push(arg);
            }
        }

        return cmp;
    };
}

class Component {
    // whether the component is a native DOM element or prefixed with `nn-`
    static get native() {
        return false;
    }

    static get opacity() {
        return 1;
    }

    static get scale() {
        return 1;
    }

    static get scaleX() {
        return 1;
    }

    static get scaleY() {
        return 1;
    }

    static get scaleZ() {
        return 1;
    }

    static get rotate() {
        return 0;
    }

    static get rotateX() {
        return 0;
    }

    static get rotateY() {
        return 0;
    }

    static get rotateZ() {
        return 0;
    }

    static get translateX() {
        return 0;
    }

    static get translateY() {
        return 0;
    }

    static get translateZ() {
        return 0;
    }

    static get width() {
        return null;
    }

    static get height() {
        return null;
    }

    static get left() {
        return null;
    }

    static get right() {
        return null;
    }

    static get top() {
        return null;
    }

    static get bottom() {
        return null;
    }

    static get aspectRatio() {
        return null;
    }

    // component CSS style that overwrites static styles
    get style() {
        return {};
    }

    // whether a click event is sent to this component
    get click() {
        return false;
    }

    /* Re-distribute child components passed by creator during rendering.
     * If a child is not appended to another other component after render() is complete,
     * it will be appended as child like other incoming components created by render().
    */
    children() {
        for (const child of appended.get(this) || []) {
            incoming.add(child);
        }
        appended.delete(this);
    }

    /**
     * Render the component.
     * By default appends all child components passed from wrapComponent.
     */
    render() {
        this.children();
    }

    async init() {
        // called when component is initialized before mounting
    }
};

export type _Component = Component;
export type _ComponentType = typeof Component;

/** Components defined in the current scope. */
const dict = { Component } as UI;

/**
 * Define a component.
 * @param target Component class.
 * @param mode Permission of the component defition.
 */
export function registerComponent(name: string, target: typeof Component) {
    if (!isCapatalized(name)) {
        throw new Error(`Component name ${name} must be capatalized`);
    }

    if (name in dict) {
        // extend existing component if applicable
        if (target.prototype instanceof dict[name]) {
            dict[name] = target;
            dict[unCapitalize(name)] = wrapComponent(target);
        }
        else {
            throw new Error(`Component ${name} already defined`);
        }
    }
    else {
        dict[name] = target;
        dict[unCapitalize(name)] = wrapComponent(target);
    }
}

/** Read-only UI getter for extensions. */
export const ui = new Proxy(dict, {
    get: function (target, prop: Capitalize<string> | Uncapitalize<string>) {
        return target[prop];
    }
});
