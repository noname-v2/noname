import { isCapatalized, unCapitalize } from "../utils";

// map from component to its parent
const parent = new Map<Component, Component>();

// map from component to child components
const children = new Map<Component, Component[]>();

// newly created components without parent
const unparented = new Set<Component>();

function wrapComponent(target: ComponentType): ComponentCreator {
    return (...args) => {
        const cmp = new target();
        unparented.add(cmp);

        // if (parent) {
        //     parents.set(cmp.id, parent.id);
        //     if (!children.has(parent.id)) {
        //         children.set(parent.id, new Set([cmp.id]));
        //     }
        //     else {
        //         children.get(parent.id)!.add(cmp.id);
        //     }
        // }

        // renderStack.push(cmp);
        // cmp.render();
        // if (cmp != renderStack.pop()) {
        //     throw new Error("Render stack mismatch");
        // }
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

    children() {
        return [];
    }

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
export function defineComponent(name: string, target: typeof Component) {
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
