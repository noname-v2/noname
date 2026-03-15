import { uid } from '../utils';

// Wrapper for remote websocket connect with module `ws`
class SocketClient {
    #ws: any;

    #id = uid();
    get id() { return this.#id; }

    constructor(ws: any) {
        this.#ws = ws;
    }

    send(data: any) {
        this.#ws.send(JSON.stringify(data));
    }

    close() {
        this.#ws.close();
    }
}

// Wrapper for local web worker connection
class WorkerClient {
    #id = uid();
    get id() { return this.#id; }

    send(data: any) {
        self.postMessage(data);
    }

    close() {
        // TODO reload client
        (self as any).close();
    }
}

// Event handlers
type ON = Dict<(client: WorkerClient | SocketClient, data?: any) => void>;

// Initializers for different channel types
const channels = {
    ws(on: ON) {
        // Create a websocket server
        const WebSocketServer = require('ws').Server;
        const wss = new WebSocketServer({ port: 8080 });

        // Handle connection events
        wss.on('connection', (ws: any) => {
            const client = new SocketClient(ws);
            on['open']?.(client);
            ws.on('message', (msg: string) => on['message']?.(client, JSON.parse(msg)));
            ws.on('close', (e: any) => on['close']?.(client, e));
            ws.on('error', (e: any) => on['error']?.(client, e));
        });
    },
    worker(on: ON) {
        // Create a worker client for main thread
        const client = new WorkerClient();
        self.onmessage = (e: MessageEvent) => {
            on['message']?.(client, e.data);
        }
        queueMicrotask(() => on['open']?.(client));
    }
};

// Channel types
export type ChannelName = keyof typeof channels;
export type RemoteClient = WorkerClient | SocketClient;

export default class Channel {
    // Event callbacks
    #on: ON = {};

    // Set message handler for client messages
    on(evt: ChannelEvent, callback: ON[ChannelEvent]) {
        this.#on[evt] = callback;
    }

    // Add a server
    add(channel: ChannelName) {
        channels[channel](this.#on);
    }
};