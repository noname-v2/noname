/** Function library for serialization. */
class Library {
    /** Built-in functions. */
    #base = new Map<string, SF>();

    /** Functions defined by current game mode. */
    #mode = new Map<string, SF>();

    /** Functions defined by extensions. */
    #extension = new Map<string, SF>();

    get(key: string) {
        if (key.includes(':')) {
            return this.#extension.get(key) ?? null;
        }

        return this.#mode.get(key) ?? this.#base.get(key) ?? null;
    }

    register(key: string, val: SF) {
        this.#base.set(key, val);
    }
}

export const lib = new Library();
