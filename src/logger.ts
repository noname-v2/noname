export class Logger {
    debug = false;

    log(message?: any, ...optionalParams: any[]) {
        if (this.debug) {
            console.log(message, ...optionalParams);
        }
    }

    warn(message?: any, ...optionalParams: any[]) {
        if (this.debug) {
            if (typeof message === 'string') {
                throw new Error(message);
            }
            else {
                throw message;
            }
        }
        else {
            console.warn(message, ...optionalParams);
        }
    }

    error(message?: any, ...optionalParams: any[]) {
        if (this.debug) {
            if (typeof message === 'string') {
                throw new Error(message);
            }
            else {
                throw message;
            }
        }
        else {
            console.error(message, ...optionalParams);
        }
    }
}

export default new Logger();