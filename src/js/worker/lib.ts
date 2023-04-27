/** Function library for serialization. */
class Library {
    #base = new Map<string, SF>();
    #ext = new Map<string, SF>();

    get(key: string) {
        return this.#ext.get(key) ?? this.#base.get(key) ?? null;
    }

    register(key: string, val: SF) {
        this.#base.set(key, val);
    }
}

export const lib = new Library();
