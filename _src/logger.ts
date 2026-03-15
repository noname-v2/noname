export default class Logger {
    constructor(public debug = false) {
        if (debug) {
            (globalThis as any).nn = this;
        }
    }

    log(message?: any, ...optionalParams: any[]) {
        if (this.debug) {
            console.log(message, ...optionalParams);
        }
    }

    warn(message?: any, ...optionalParams: any[]) {
        console.warn(message, ...optionalParams);
        if (this.debug) {
            if (typeof message === 'string') {
                throw new Error(message);
            }
            else {
                throw message;
            }
        }
    }

    error(message?: any, ...optionalParams: any[]) {
        console.error(message, ...optionalParams);
        if (this.debug) {
            if (typeof message === 'string') {
                throw new Error(message);
            }
            else {
                throw message;
            }
        }
    }
}