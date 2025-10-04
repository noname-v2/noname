import type Server from "./server";
import { apply, copy } from "../utils";

const stageStatus = {
    none: 0, // Not started
    before: 1, // Pre-stage, go to 'skip' if skip() is called, otherwise, go to 'begin'
    begin: 2, // Stage started, go to 'cancel' if main cannot be executed (e.g. draw 0 card), otherwise, go to 'main'
    main: 3, // Main execution, go to 'cancel' if condition is no longer met during execution (e.g. target died), otherwise, go to 'end'
    end: 4, // Finalization after main is completed
    after: 5, skip: 5, cancel: 5,// After main event is done / skipped / cancelled
    done: 6, skipped: 6, cancelled: 6 // End state
} as const;

export default class Stage {
    #data: {
        arg: Dict;
        props: Dict;
        history: Stage[]; // Stack of previous stages
        running: Stage[]; // Stack of currently running child stages
        parent: Stage | null;
        source: Stage | null;
        status: keyof typeof stageStatus;
        step: number;
        result: Dict | null; // Return value of run(), null if stage not finished
    };

    // Reference to the Server instance
    #server: Server;

    // Current running stage
    get #current() {
        return this.#data.running[this.#data.step];
    }

    constructor({ data, server, init }: EntityAPI, parent: Stage | null, source: Stage | null, arg?: Dict) {
        // Initialize component properties
        this.#data = data;
        this.#server = server;

        if (init(this)) {
            // Restored from saved state and does not need initialization
            return;
        }
        // Initialize component data
        data.arg = copy(arg) || {};
        data.props = {};
        data.history = [];
        data.running = [];
        data.parent = parent;
        data.source = source;
        data.status = 'none';
        data.step = 0;
        data.result = null;
    }

    // Update component properties.
    update(update: ComponentProps) {
        apply(this.#data.props, update);
    }

    // Set component property
    set(key: string, value: any) {
        this.update({ [key]: value });
    }

    // Get component property
    get(key: string) {
        return key in this.#data.props ? this.#data.props[key] : this.#data.arg[key];
    }

    // Add and run a child stage
    async next(tag: string, arg?: Dict) {
        const lib = this.#server.lib;
        const current = this.#current;
        if (lib.tag(current) === tag) {
            // Child stage matches a saved child stage
            const result = lib.get(current, 'result');
            // Return result directly if child execution finished, otherwise call this.#run()
            if (result) {
                return result;
            }
        }
        else {
            // Create a new child stage
            const child = lib.create('stage', tag, this, this, arg);
            this.#data.step = this.#data.running.length;
            this.#data.running.push(child);
        }

        return await this.#run();
    }

    // Run current stage
    async #run() {
        const current = this.#current;
        if (!current) {
            this.#server.error('Attempting to execute an empty stage');
        }
    }
};
