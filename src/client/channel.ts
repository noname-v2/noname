class SocketChannel {
    #socket: WebSocket;

    constructor(src: string) {
        this.#socket = new WebSocket(src);
    }

    send(msg: any) {
        this.#socket.send(JSON.stringify(msg));
    }

    on(evt: ChannelEvent, callback: (data: any) => void) {
        this.#socket.addEventListener(evt, (e) => {
            if (evt === 'message') {
                callback(JSON.parse((e as MessageEvent).data));
            }
            else {
                callback(e);
            }
        });
    }
}

class WorkerChannel {
    #worker: Worker;

    constructor(src: string) {
        this.#worker = new Worker(src);
    }

    send(msg: any) {
        this.#worker.postMessage(msg);
    }

    on(evt: ChannelEvent, callback: (data?: any) => void) {
        if (evt === 'open') {
            // Worker is ready immediately after creation
            queueMicrotask(() => callback());
            return;
        }
        else {
            // Listen for other events
            this.#worker.addEventListener(evt, (e) => {
                if (evt === 'message') {
                    callback((e as MessageEvent).data);
                }
                else {
                    callback(e);
                }
            });
        }
    }
}

export default class Channel {
    #channel: WorkerChannel | SocketChannel;

    constructor(src: string) {
        if (src.startsWith('ws://') || src.startsWith('wss://')) {
            // TODO: remote connection via websocket
            this.#channel = new SocketChannel(src);
        }
        else if (src.endsWith('.js')) {
            // Create a web worker to run the server code
            this.#channel = new WorkerChannel(src);
        }
        else {
            throw new Error('Invalid source for client factory: ' + src);
        }

        this.on('open', () => this.send('init'));
    }

    send(msg: any) {
        this.#channel.send(msg);
    }

    on(evt: ChannelEvent, callback: (data: any) => void) {
        this.#channel.on(evt, callback);
    }
}