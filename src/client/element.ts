import { toKebab } from "../utils";

// Lifecycle callbacks for custom element.
// Note: custom elements should only be used for real-time interactions
// like dragging and swiping when sending to worker is too expensive
export default interface Callbacks {
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

// built-in custom element callbacks
const stockCallbacks = new Map<string, Callbacks>();

// extension-defined custom element callbacks (higher priority than system, but clears when game changes)
const extensionCallbacks = new Map<string, Callbacks>();

class NonameElement extends HTMLElement {
    constructor() {
        super();
        (extensionCallbacks.get(this.tagName)?.created
            || stockCallbacks.get(this.tagName)?.created)?.call(this);
    }

    connectedCallback() {
        (extensionCallbacks.get(this.tagName)?.connected
            || stockCallbacks.get(this.tagName)?.connected)?.call(this);
    }

    disconnectedCallback() {
        (extensionCallbacks.get(this.tagName)?.disconnected
            || stockCallbacks.get(this.tagName)?.disconnected)?.call(this);
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        (extensionCallbacks.get(this.tagName)?.attributeChanged
            || stockCallbacks.get(this.tagName)?.attributeChanged)?.call(this, name, oldValue, newValue);
    }
}

// Define custom callbacks for the given tag
export function registerElement(tag: string, callbacks: Callbacks, isExtension = false) {
    const tagName = ('nn-' + toKebab(tag));
    const tagNameUpper = tagName.toUpperCase();

    if (isExtension) {
        extensionCallbacks.set(tagNameUpper, callbacks);
    }
    else {
        stockCallbacks.set(tagNameUpper, callbacks);
    }
}

// Create a new element
export function createElement(tagName: string) {
    if (tagName.startsWith('nn-') && !customElements.get(tagName)) {
        const tagNameUpper = tagName.toUpperCase();
        customElements.define(tagName, class extends NonameElement {
            static get observedAttributes() {
                return extensionCallbacks.get(tagNameUpper)?.observedAttributes
                    || stockCallbacks.get(tagNameUpper)?.observedAttributes
                    || [];
            }
        });
    }
    return document.createElement(tagName);
}