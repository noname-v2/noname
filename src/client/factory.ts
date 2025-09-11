export default class Factory {
    #worker: Worker;
    #name: string;

    constructor(name: string) {
        this.#worker = new Worker(name + '.js');
        this.#name = name;
    }

    get worker() {
        return this.#worker;
    }

    get name() {
        return this.#name;
    }
}