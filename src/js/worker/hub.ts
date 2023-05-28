import { apply } from "../utils";

type Send = (uid: string, msg: Dict) => void;

/** Manages communication from and to client. */
class Hub {
    /** Playerd (including owner) that joined the room. */
    #joined = new Map<string, string | null>();

    /** Function to send message to client, */
    #send!: Send;

    /** Raw objects that contian link properties. */
    #dicts = new Map<string, Dict>();

    /** Links to a client-side component. */
    #links = new Map<string, Dict>();

    /** UI updates pending for commit. */
    #ticks: [string, string, any][] = [];

    /** Current link count used as default link ID. */
    #cid = 0;

    /** Count of number of stages executed as an identifier to reject outdated client message. */
    #sid = 0;

    /** Initialize hub.
    * @param send - Function to send message to client.
    */
    init(owner: string, send: Send) {
        this.#joined.set(owner, null);
        this.#send = send;
    }

    /** Callback function when a client sends a mesage. */
    onmessage(uid: string, message: string | Dict) {
        if (message === 'init') {
            // client initializes connection
            this.#joined.set(uid, null);
            const changes: Dict = {};
            for (const [cid, data] of this.#dicts) {
                changes[cid] = data;
            }
            this.#send(uid, changes);
        }
        else if (message === 'auto') {
            // client changes stats to auto
            this.#joined.set(uid, 'auto');
        }
        else if (typeof message === 'string') {

        }
        else {

        }
    }

    /** Callback function when a client disconnects. */
    onclose(uid: string) {
        this.#joined.delete(uid);
    }

    /** Get a link by its ID. */
    get(cid: string) {
        return this.#links.get(cid) ?? null;
    }

    /** Create a link to a client-side component. */
    link(cid?: string) {
        cid ??= 'c:' + this.#cid++;
        const data: Dict = {};
        this.#dicts.set(cid, data);

        return new Proxy(data, {
            get: (_, key: string) => {
                return data[key];
            },
            set: (_, key: string, val: any) => {
                if (key[0] === '$' && val?.constructor === Object) {
                    key = key.slice(1);
                    data[key] ??= {};
                    apply(data[key], val);
                }
                else {
                    data[key] = val;
                }
                this.#tick(cid!, key, val);
                return true;
            }
        })
    }

    /** Monitor message from client. */
    monitor() {
        
    }

    /** Await response from client. */
    async require() {

    }

    /** Set as a new stage and reject old messages. */
    stage() {
        return this.#sid++;
    }

    /** Add an UI update to queue. */
    #tick(cid: string, key: string, val: any) {
        if (this.#ticks.length === 0) {
            // schedule a UITick if no pending UITick exists
            setTimeout(() => this.#commit());
        }
        this.#ticks.push([cid, key, val]);
    }

    /** Send UI changes to clients. */
    #commit() {
        const changes: Dict = {};
        for (const [cid, key, val] of this.#ticks) {
            changes[cid] ??= {};
            if (key[0] === '$' && val?.constructor === Object) {
                changes[cid][key] ??= {};
                apply(changes[cid][key], val);
            }
            else {
                changes[cid][key] = val;
            }
        }
        this.#ticks.length = 0;

        for (const uid of this.#joined.keys()) {
            this.#send(uid, changes);
        }
    }
}

export const hub = new Hub();
