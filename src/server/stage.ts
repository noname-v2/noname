import type Server from "./server";
import { apply, copy } from "../utils";

export enum StageStatus {
    None = 0, // Not started
    Before = 1, // Pre-stage, go to 'after' if skip() is called, otherwise, go to 'begin'
    Begin = 2, // Stage started
    Main = 3, // Main execution
    End = 4, // Finalization after main is completed
    After = 5, // After main event is done / skipped
    Done = 6 // End state
}

export default class Stage {
    #data: {
        arg: Dict;
        props: Dict;
        history: Dict<Plain>[]; // Stack of previous stages
        running: Stage[]; // Stack of currently running child stages
        parent: Stage | null;
        source: Stage | null;
        status: StageStatus; // Index in stageStatus
        step: number; // Current step in running[]
        result?: Dict; // Return value of run(), null if stage not finished
        cancelled?: true; // Whether the stage ends early because condition is no longer met, e.g. draw 0 cards or target died
        skipped?: true; // Whether the stage is skipped (called in the before step)
        executing?: string; // Name of the current executing function if not main
        toExecute?: string; // Name of the function to execute next
    };

    // Reference to the Server instance
    #server: Server;
    get server() {
        return this.#server;
    }

    // Stage status
    get status() {
        return StageStatus[this.#data.status];
    }

    // Stage execution result
    get result() {
        return this.#data.result;
    }

    // Stage execution finished
    get done() {
        return this.status === 'done';
    }

    constructor({ data, server, init }: EntityAPI, parent?: Stage, source?: Stage, arg?: Dict) {
        // Initialize component properties
        this.#data = data;
        this.#server = server;

        if (init(this)) {
            // Restored from saved state and does not need initialization
            return;
        }
        // Initialize component data
        this.#data.arg = copy(arg) || {};
        this.#data.props = {};
        this.#data.history = [];
        this.#data.running = [];
        if (parent) {
            this.#data.parent = parent;
        }
        if (source) {
            this.#data.source = source;
        }
        this.#data.status = StageStatus.None;
        this.#data.step = 0;
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
};
