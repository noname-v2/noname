import { isDict } from "../utils";

// map from component to its parent
const parent = new Map<Component, Component>();

// map from component to child components
const children = new Map<Component, Component[]>();

// newly created components to be processed
const incoming = new Set<Component>();

/* child components from the args of ComponentCreator(), to be processed by the render() method of component A
 * by calling A.children. It can be later appended to either a child component of A or
 * A itself depending on where A.children() is called.
 */
const appended = new Map<Component, Component[]>();

export function render(cmp: Component) {
    if (incoming.size) {
        throw new Error("Another component is being rendered.");
    }

    cmp.render();

    // add all newly created components to yet appended to cmp
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
        /* When a new component is created, it is either passed as a parameter of ComponentCreator,
         * or appended to the current rendering component. Putting it to incoming and decide afterwards.
         */
        const cmp = new target();
        incoming.add(cmp);

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
                dispatch(arg);
            }
            else if (Array.isArray(arg)) {
                for (const item of arg) {
                    if (item instanceof Component) {
                        dispatch(item);
                    }
                }
            }
            else if (isDict(arg)) {
                cmp.props = arg;
            }
        }

        return cmp;
    };
}

export default class Component {
    // properties passed from parent renderer
    props: Dict | null = null;

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
        const children = appended.get(this) || [];
        for (const child of children) {
            incoming.add(child);
        }
        appended.delete(this);
        return children;
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