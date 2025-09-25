import Factory from "./factory";
import elements from '../build/elements';
import { registerElement } from "./element";

export default class Client {
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
        if (src.startsWith('ws://') || src.startsWith('wss://')) {
            // TODO: remote connection via websocket
            throw new Error('WebSocket connection not implemented yet');
        }
        else if (src.endsWith('.js')) {
            // Create a web worker to run the server code
            const worker = new Worker(src);
            const factory = new Factory(document.body, (msg: any) => worker.postMessage(msg));
            worker.onerror = e => console.log(e);
            worker.onmessage = e => factory.onmessage(e.data);
            return factory;
        }
        else {
            throw new Error('Invalid source for client factory: ' + src);
        }
    }
}