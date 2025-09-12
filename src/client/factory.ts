export default class Factory {
    // worker name
    #name: string;

    // worker object for dom commands
    #worker: Worker;

    // // list of all elements key: element id, value: [element tag, ElementData]
    // #elements = new Map<number, [string, ElementData]>();

    constructor(name: string) {
        this.#worker = new Worker(name + '.js');
        this.#name = name;
        // from here: createRoot() and sync UI
        // elements: Map<id: int, [tag: string, className?: string, style?: Dict<Plain>, ...children: number[]]>
        // from here: client-side elements folder for CustomElement definitions (drag, resize, lines, ...)
        // WeakMap<customElement, [props, state, callback, ...]>
        // WeakMap<customElement, children>
        // WeakMap<customElement, parent>
        // customElements should only be used for real-time interactions like dragging and swiping when sending to worker is too expensive
    }

    get worker() {
        return this.#worker;
    }

    get name() {
        return this.#name;
    }
}


// Useful lifecycle callback methods in a custom element (extending HTMLElement) include:

// connectedCallback()
// Called each time the element is inserted into the DOM.

// Ideal for setup tasks like rendering, fetching resources, or adding event listeners.

// Similar to React’s componentDidMount.

// disconnectedCallback()
// Called each time the element is removed from the DOM.

// Use it to clean up event listeners, stop timers, or release resources.

// Similar to React’s componentWillUnmount.

// attributeChangedCallback(name, oldValue, newValue)
// Called whenever one of the element’s observed attributes changes.

// To use this, define a static observedAttributes array listing attribute names to watch.

// Useful for responding to changes in element attributes dynamically.