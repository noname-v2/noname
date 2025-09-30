

// import { createRoot, config } from './tree';
// import { toKebab } from "../utils";
// import { getMaker, toCSS, defaultCSS } from "./component";
import Logger from '../logger';
// import Component from "./component";
import Channel from './channel';
import Library from './library';
import Tree from './tree';
import { getStyleString } from './css';

export default class Server {
    // Channel managing client-server communication
    channel = new Channel(this);

    // Library managing entity definitions
    lib = new Library(this);

    // Logger for server messages
    logger: Logger;

    // Virtual DOM tree
    tree = new Tree(this);

    // UI object for creating components
    ui = new Proxy(this.lib.refs('component'), {
        get: (target, tag: string) => {
            if (!(tag in target)) {
                target[tag] = { native: true };
            }
            return ((...args) => this.lib.create('component', tag, this, ...args)) as UI[string];
        }
    }) as UI;

    constructor(public options: ServerOptions = {}) {
        this.logger = new Logger(options.debug)

        if (options.debug) {
            (globalThis as any).server = this;
        }
    }

    // Start the server
    start() {
        // Add a default client if none exists
        this.logger.log('Server started');
        if (!this.channel.clients.size) {
            this.channel.clients.add('self');
        }
        // Initialize the root stage and component
        this.tree.createRoot(this.ui.app());
        // from here: init stages, load state, etc.
        const styleString = getStyleString(this.lib.refs('component'));
        this.logger.log(styleString);
        this.channel.broadcast({ 'css': styleString });
    }
}