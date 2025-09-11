import Factory from "./factory";

export default class Client {
    registerFS() {
        // Register the file system
    }

    createFactory(name: string) {
        // Create a factory that loads the given `${name}.js`
        return new Factory(name);
    }
}