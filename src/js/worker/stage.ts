import { hub } from './hub';
import { lib } from './lib';

let currentStage: Stage;

/** Object passed as the second argument of stage function. */
const api = Object.freeze({
    link: (cid?: string) => hub.link(cid),
    monitor: () => hub.monitor(),
    require: () => hub.require(),
    run: (main: string, props: Dict) => currentStage.progress(main, props)
});

export type StageAPI = typeof api;

/** Function wrapper for progress backup and restore. */
class Stage {
    /** Current index of child stage. */
    #step = 0;

    /** Reference to the main function. */
    #main: string;

    /** Stage properties determined upon creation. */
    #props: string;

    /** Stage properties that can be changed during execution. */
    #data: Dict;

    /** History of executed child stages. */
    #history: Stage[] = [];

    /** Return value of main function. */
    #result: any = null;

    get result() {
        return this.#result;
    }

    get extension() {
        return this.#main[0] === '#' ? null : this.#main.split(':')[0];
    }

    constructor(main: string, props: string | Dict) {
        this.#main = main;

        if (typeof props === 'string') {
            this.#props = props;
            this.#data = JSON.parse(props);
        }
        else {
            this.#props = JSON.stringify(props);
            this.#data = props;
        }

        hub.stage();
    }

    /** Execute the main function. */
    async run() {
        const main = lib.get(this.#main);
        if (main) {
            const parentStage = currentStage;
            currentStage = this;

            this.#result = await main(this.#data, api);

            currentStage = parentStage;
        }
        return this.#result;
    }

    async progress(main: string, props: string | Dict) {
        if (main[0] !== '#') {
            // change to absolute extension function reference
            const path = main.split(':');
            if (path.length !== 2) {
                if (path.length !== 1 || !this.extension) {
                    throw('Invalid function string.');
                }
                main = this.extension + ':' + path[0];
            }
        }

        if (this.#history[this.#step]?.match(main, props)) {
            // stage already executed
            this.#step++;
            return this.#history[this.#step-1].result;
        }
        else {
            this.#history.length = this.#step;
            const stage = new Stage(main, props);
            this.#history.push(stage);
            await stage.run();
            this.#step++;
            return stage.result;
        }
    }

    match(main: string, props: string | Dict) {
        if (typeof props !== 'string') {
            props = JSON.stringify(props);
        }
        return this.#main === main && this.#props === props;
    }
}

/** Decorator that creates a stage from a class method. */
export function createRoot(main: string, props: Dict) {
    currentStage = new Stage(main, props);
    return currentStage.run();
}
