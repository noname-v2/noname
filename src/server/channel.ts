import type Server from './server';

export default class Channel {
    // Connected clients
    #clients = new Set<string>();

    // Reference to the Server instance
    #server: Server;

    constructor(server: Server) {
        this.#server = server;
    }

    get clients() {
        return this.#clients;
    }

    // Send data to a client
    send(id: string, data: any) {
        if (!this.clients.has(id)) {
            return;
        }
        self.postMessage(data);
    }

    // Send data to all clients
    broadcast(data: any) {
        self.postMessage(data);
    }

    // Set message handler for client messages
    onmessage(callback: (data: any) => void) {
        // from here: route messages to correct client if multiple clients
        self.onmessage = ({ data }) => {
            this.#server.logger.log('Received message:', data);
            callback(data);
        };
    }
};