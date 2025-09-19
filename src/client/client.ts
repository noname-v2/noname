import Factory from "./factory";
import elements from '../build/elements';
import { registerElement } from "./element";

for (const ext of elements) {
    const defs = ext({});
    for (const key in defs) {
        registerElement(key, defs[key], true);
    }
}

export default class Client {
    start() {
        this.createFactory('server.js');
    }

    createFactory(name: string) {
        // Create a factory that loads the given `${name}.js`
        return new Factory(name, document.body);
    }
}