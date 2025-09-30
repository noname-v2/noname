import Factory from "./factory";
import elements from '../build/elements';
import { registerElement } from "./element";
import Logger from "../logger";
import Channel from './channel';

export default class Client {
    // Logger for server messages
    logger: Logger;

    // Channel for communication with server
    channel: Channel | null = null;

    constructor(public options: ClientOptions = {}) {
        this.logger = new Logger(options.debug)

        if (options.debug) {
            (globalThis as any).client = this;
        }
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
        if (src.startsWith('ws://') || src.startsWith('wss://')) {
            // TODO: remote connection via websocket
            throw new Error('WebSocket connection not implemented yet');
        }
        else if (src.endsWith('.js')) {
            // Create a web worker to run the server code
            const factory = new Factory(document.body, this);
            this.channel = new Channel(src, factory, this.logger);
            return factory;
        }
        else {
            throw new Error('Invalid source for client factory: ' + src);
        }
    }

    send(msg: any) {
        this.channel?.send(msg);
    }
}