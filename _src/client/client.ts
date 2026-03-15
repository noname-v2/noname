import Factory from "./factory";
import elements from '../build/elements';
import { registerElement } from "./element";
import Logger from "../logger";

export default class Client extends Logger {
    constructor(public options: ClientOptions = {}) {
        super(options.debug)
    }

    start() {
        const factory = this.createFactory('server.js');
        for (const defs of elements) {
            for (const key in defs) {
                registerElement(key, defs[key], factory);
            }
        }
    }

    // Create a factory with web worker or websocket 
    createFactory(src: string) {
        return new Factory(document.body, this, src);
    }
}