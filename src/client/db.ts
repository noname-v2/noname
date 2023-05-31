class Database {
    /** Opened indexedDB object. */
    #db: IDBDatabase;

    /** Cache of settings. */
    #cache: Map<string, any>;

    constructor(db: IDBDatabase, cache: Map<string, any>) {
        this.#db = db;
        this.#cache = cache;
    }

    /** Get, set or delete a database entry. */
    #transact(name: 'settings' | 'files', cmd: 'get' | 'put' | 'delete', key: string, value?: unknown) {
        return new Promise(resolve => {
            const mode = cmd === 'get' ? 'readonly' : 'readwrite';
            const store = this.#db.transaction(name, mode).objectStore(name);
            const request = cmd === 'put' ? store[cmd](value, key) : store[cmd](key);
            request.onsuccess = () => resolve(request.result ?? null);
        });
    }

    /** Get value of synchronous database entry. */
    get(key: string): any {
        return this.#cache.get(key) ?? null;
    }

    /** Set value of synchronous database entry. */
    set(key: string, value?: unknown) {
        if (value === null || value === undefined) {
            // delete entry
            this.#cache.delete(key);
            this.#transact('settings', 'delete', key);
        }
        else {
            // modify entry
            this.#cache.set(key, value);
            this.#transact('settings', 'put', key, value);
        }
    }

    /** Get value from asynchronous database. */
    readFile(key: string): any {
        return this.#transact('files', 'get', key);
    }

    /** Set value to asynchronous database. */
    writeFile(key: string, value?: unknown) {
        if (value === null || value === undefined) {
            // delete entry
            return this.#transact('files', 'delete', key);
        }
        else {
            // modify entry
            return this.#transact('files', 'put', key, value);
        }
    }

    /** List all items in asynchronous database. */
    readdir() {
        const store = this.#db!.transaction('files', 'readonly').objectStore('files');
        const iterator = store.openCursor();
        const files: string[] = [];
        
        return new Promise<string[]>(resolve => {
            iterator.onsuccess = () => {
                const cursor = iterator.result;
                if (cursor) {
                    files.push(cursor.key as string);
                    cursor.continue();
                }
                else {
                    resolve(files);
                }
            };
        });
    }
}

/** Database object (can be null is indexedDB finished initialization). */
export let db: Database | null = null;

/** A promise that resolves when indexedDB finishes initialization. */
export const ready = new Promise<Database>(resolve => {
    // open database
    const request = indexedDB.open('noname_v2', 2);

    // create new database
    request.onupgradeneeded= () => {
        // synchronous
        if (!request.result.objectStoreNames.contains('settings')) {
            request.result.createObjectStore('settings');
        }

        // asynchronous
        if (!request.result.objectStoreNames.contains('files')) {
            request.result.createObjectStore('files');
        }
    };

    // cache database and resolve
    request.onsuccess = () => {
        const res = request.result;
        const cache = new Map<string, any>();

        // cache synchronous database
        const store = res.transaction('settings', 'readonly').objectStore('settings');
        const iterator = store.openCursor();

        iterator.onsuccess = () => {
            const cursor = iterator.result;
            if (cursor) {
                cache.set(cursor.key as string, cursor.value);
                cursor.continue();
            }
            else {
                db = new Database(res, cache)
                resolve(db);
            }
        };
    };
});
