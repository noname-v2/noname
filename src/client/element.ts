import { toKebab } from "../utils";
import type Factory from "./factory";

// Lifecycle callbacks for custom element.
// Note: custom elements should only be used for real-time interactions
// like dragging and swiping when sending to worker is too expensive
interface Callbacks {
    // called when the element is created
    created?: () => void;

    // called when the element is added to the DOM
    connected?: () => void;

    // called when the element is removed from the DOM
    disconnected?: () => void;

    // called when an observed attribute is changed
    attributeChanged?: (name: string, oldValue: string, newValue: string) => void;

    // list of attributes to observe for changes
    observedAttributes?: string[];
}

// Callbacks grouped by factory context
const factories: Factory[] = [];
const factoryCallbacks: Map<string, Callbacks>[] = [];

// Get the callback function with custom callbacks (registered later) having higher priority
function getCallback(tagName: string, method: keyof Callbacks): any {
    for (let i = factories.length; i-- > 0;) {
        const func = factoryCallbacks[i].get(tagName)?.[method];
        if (func) {
            return func;
        }
    }
    return null;
}

class NonameElement extends HTMLElement {
    constructor() {
        super();
        getCallback(this.tagName, 'created')?.call(this);
    }

    connectedCallback() {
        getCallback(this.tagName, 'connected')?.call(this);
    }

    disconnectedCallback() {
        getCallback(this.tagName, 'disconnected')?.call(this);
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        getCallback(this.tagName, 'attributeChanged')?.apply(this, [name, oldValue, newValue]);
    }
}

// Define custom callbacks for the given tag
export function registerElement(tag: string, callbacks: Callbacks, factory: Factory) {
    const tagName = ('nn-' + toKebab(tag));
    const tagNameUpper = tagName.toUpperCase();
    let index = factories.indexOf(factory);
    if (index === -1) {
        index = factories.length;
        factories.push(factory);
        factoryCallbacks.push(new Map<string, Callbacks>());
    }
    factoryCallbacks[index].set(tagNameUpper, callbacks);
}

// Create a new element
export function createElement(tagName: string) {
    if (tagName.startsWith('nn-') && !customElements.get(tagName)) {
        const tagNameUpper = tagName.toUpperCase();
        customElements.define(tagName, class extends NonameElement {
            static get observedAttributes() {
                return getCallback(tagNameUpper, 'observedAttributes') || [];
            }
        });
    }
    return document.createElement(tagName);
}