import type Factory from "./factory";

export default class Channel {
    worker: Worker;
    constructor(src: string, factory: Factory) {
        this.worker = new Worker(src);
        this.worker.onerror = e => console.log(e);
        this.worker.onmessage = e => factory.onmessage(e.data);
    }

    send(msg: any) {
        this.worker.postMessage(msg);
    }
}