import type Factory from "./factory";
import type Logger from "../logger";

export default class Channel {
    worker: Worker;
    constructor(src: string, factory: Factory, logger: Logger) {
        this.worker = new Worker(src);
        this.worker.onerror = e => logger.log(e);
        this.worker.onmessage = e => factory.onmessage(e.data);
    }

    send(msg: any) {
        this.worker.postMessage(msg);
    }
}