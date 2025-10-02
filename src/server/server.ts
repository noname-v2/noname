

// import { createRoot, config } from './tree';
// import { toKebab } from "../utils";
// import { getMaker, toCSS, defaultCSS } from "./component";
import Logger from '../logger';
// import Component from "./component";
import Channel from './channel';
import Library from './library';
import Tree from './tree';
import { getStyleString } from './css';
import type { RemoteClient, ChannelName } from './channel';

export default class Server extends Logger {
    // Default channel type
    type: ChannelName = 'worker';

    // Server options
    #options: ServerOptions;

    // Pre-computed style string for all clients
    #css!: string;

    // Communication channel with clients
    #channel = new Channel();

    // Connected clients
    #clients = new Map<string, RemoteClient>();

    // Library managing entity definitions
    #lib = new Library(this);

    // Virtual DOM tree
    #tree = new Tree(this);

    // Getters for classes in ./server folder
    get lib() { return this.#lib; }
    get ui() { return this.#tree.ui; }

    constructor(public options: ServerOptions = {}) {
        super(options.debug);
        this.#options = options;

        // Handle new client connections
        this.#channel.on('open', (client) => {
            this.log('Client connected', client.id);
            // Give client 10s to identify itself before closing connection
            setTimeout(() => {
                if (!this.#clients.has(client.id)) {
                    this.log('Client failed to identify, disconnecting', client.id);
                    client.close();
                }
            }, 10000);
        });

        // Handle client messages
        this.#channel.on('message', (client, msg) => {
            this.log('Message from', client.id, msg);
            if (msg === 'init') {
                this.#clients.set(client.id, client);
                this.#tree.init(client.id, this.#css);
            }
        });
    }

    // Start the server
    start() {
        // Add a default client if none exists
        this.log('Server started');
        
        // Add channels
        this.#channel.add(this.#options.channel || this.type);

        // Initialize the root stage and component
        this.#tree.createRoot(this.ui.app());
        this.#css = getStyleString(this.lib.refs('component'));
        // from here: init stages, load state, etc.
    }

    // Send data to a client
    send(id: string, data: any) {
        this.#clients.get(id)?.send(data);
    }

    // Send data to all clients
    broadcast(data: any) {
        this.#clients.forEach(client => client.send(data));
    }
}