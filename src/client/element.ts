import { toKebab } from "../utils";

// lifecycle callbacks for custom element
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

// Register the element with the given tag
export function registerTag(tag: string) {
    const tagName = ('nn-' + toKebab(tag));
    const tagNameUpper = tagName.toUpperCase();

    if (!customElements.get(tagName)) {
        customElements.define(tagName, class extends NonameElement {
            static get observedAttributes() {
                return extensionCallbacks.get(tagNameUpper)?.observedAttributes
                    || stockCallbacks.get(tagNameUpper)?.observedAttributes
                    || [];
            }
        });
    }
    return tagNameUpper;
}

// Define custom callbacks for the given tag
export function registerElement(tag: string, callbacks: Callbacks, isExtension = false) {
    const tagName = registerTag(tag);
    if (isExtension) {
        extensionCallbacks.set(tagName, callbacks);
    }
    else {
        stockCallbacks.set(tagName, callbacks);
    }
}