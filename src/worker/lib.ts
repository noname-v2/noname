/** Build-in stage functions. */
const baseLib = new Map<string, SF>();

/** Function library for serialization. */
class Library {
    /** Built-in functions. */
    #base = new Map<string, SF>();

    /** Functions defined by extensions. */
    #extension = new Map<string, Map<string, SF>>();

    get(key: string) {
        const [ext, func] = key.split('#');

        if (ext) {
            return this.#extension.get(ext)?.get(func) ?? null;
        }

        return this.#base.get(func) ?? null;
    }

    register(key: string, val: SF) {
        const [ext, func] = key.split('#');

        if (ext) {
            if (!this.#extension.has(ext)) {
                this.#extension.set(ext, new Map());
            }
            this.#extension.get(ext)!.set(func, val);
        }
        else {
            this.#base.set(func, val);
        }
    }
}

export const lib = new Library();
