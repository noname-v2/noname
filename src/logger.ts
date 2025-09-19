export class Logger {
    debug = false;

    log(message?: any, ...optionalParams: any[]) {
        if (this.debug) {
            console.log(message, ...optionalParams);
        }
    }

    warn(message?: any, ...optionalParams: any[]) {
        if (this.debug) {
            throw new Error(message);
        }
        else {
            console.warn(message, ...optionalParams);
        }
    }

    error(message?: any, ...optionalParams: any[]) {
        if (this.debug) {
            throw new Error(message);
        }
        else {
            console.error(message, ...optionalParams);
        }
    }
}

export default new Logger();