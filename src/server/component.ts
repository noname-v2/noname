import { isDict } from "../utils";

// Map from component to its parent.
const parent = new WeakMap<Component, Component>();

// Map from component to child components.
const children = new WeakMap<Component, Component[]>();

// Newly created components to be processed.
const incoming = new Set<Component>();

// Child components from the args of ComponentCreator(), to be processed by the render() method of component A
// by calling A.children. It can be later appended to either a child component of A or
// A itself depending on where A.children() is called.
const appended = new WeakMap<Component, Component[]>();

// Components visible only to specific clients.
const exclusive = new WeakMap<Component, Set<string>>();

// Component data
const data = new WeakMap<Component, ComponentData>();

export function render(cmp: Component) {
    if (incoming.size) {
        throw new Error("Another component is being rendered.");
    }

    cmp.render();

    // Assign all incoming components without parents as the immediate child of cmp.
    if (!children.has(cmp)) {
        children.set(cmp, []);
    }
    for (const child of incoming) {
        if (parent.has(child)) {
            throw new Error("Child component is already attached to another parent.");
        }
        children.get(cmp)!.push(child);
        parent.set(child, cmp);
    }
    incoming.clear();
}

export function wrapComponent(target: ComponentType): ComponentCreator {
    return (...args) => {
        // When a new component is created, it is either passed as a parameter of ComponentCreator,
        // or appended to the current rendering component. Putting it to incoming and decide afterwards.
        const cmp = new target();
        incoming.add(cmp);

        // Assign an incoming component as one of cmp.children().
        const dispatch = (child: Component) => {
            if (!incoming.has(child)) {
                throw new Error("Unexpected child component.");
            }
            incoming.delete(cmp);
            if (!appended.has(cmp)) {
                appended.set(cmp, []);
            }
            appended.get(cmp)!.push(child);
        }

        for (const arg of args) {
            if (arg instanceof Component) {
                // Put Component to cmp.children().
                dispatch(arg);
            }
            else if (Array.isArray(arg)) {
                for (const item of arg) {
                    if (item instanceof Component) {
                        // Put Component[] (usually generated from parent.children()) to cmp.children()
                        dispatch(item);
                    }
                    else if (typeof item === "string") {
                        // List of client IDs cmp is visible to
                        if (!exclusive.has(cmp)) {
                            exclusive.set(cmp, new Set());
                        }
                        exclusive.get(cmp)!.add(item);
                    }
                }
            }
            else if (isDict(arg)) {
                // Properties assigned from parent components
                data.set(cmp, arg);
            }
            else if (typeof arg === "string") {
                // Client ID cmp is visible to
                if (!exclusive.has(cmp)) {
                    exclusive.set(cmp, new Set());
                }
                exclusive.get(cmp)!.add(arg);
            }
        }

        return cmp;
    };
}

export default class Component {
    // static dimension for alignment before element creation
    static  width() {
        return null;
    }

    // static dimension for alignment before element creation
    static get height() {
        return null;
    }

    // static dimension for alignment before element creation
    static get aspectRatio() {
        return null;
    }

    // Whether the component is a native DOM element or prefixed with `nn-`
    get native() {
        return false;
    }

    // component properties passed from parent renderer
    get props() {
        return data.get(this)?.props;
    }

    // component CSS style that overwrites static styles
    get style() {
        return data.get(this)?.style;
    }

    // component CSS style that overwrites static styles
    get data() {
        return data.get(this)?.data;
    }

    // class name
    get className() {
        return data.get(this)?.className;
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
        const children = appended.get(this) || [];
        for (const child of children) {
            incoming.add(child);
        }
        appended.delete(this);
        return children;
    }

    // Default rendering method, which appends all child components passed as the arguments of ComponentCreator.
    render() {
        this.children();
    }

    async init() {
        // Called when component is initialized before mounting
    }

    get opacity() {
        return 1;
    }

    get scale() {
        return 1;
    }

    get scaleX() {
        return 1;
    }

    get scaleY() {
        return 1;
    }

    get scaleZ() {
        return 1;
    }

    get rotate() {
        return 0;
    }

    get rotateX() {
        return 0;
    }

    get rotateY() {
        return 0;
    }

    get rotateZ() {
        return 0;
    }

    get translateX() {
        return 0;
    }

    get translateY() {
        return 0;
    }

    get translateZ() {
        return 0;
    }

    get width() {
        return (this.constructor as typeof Component).width;
    }

    get height() {
        return (this.constructor as typeof Component).height;
    }

    get left() {
        return null;
    }

    get right() {
        return null;
    }

    get top() {
        return null;
    }

    get bottom() {
        return null;
    }

    get aspectRatio() {
        return (this.constructor as typeof Component).aspectRatio;
    }
};