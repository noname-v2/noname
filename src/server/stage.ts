// import type Server from "./server";
import { apply, copy } from "../utils";

const stageStatus = [
    'none', // 0: Not started
    'before', // 1: Pre-stage, go to 'after' if skip() is called, otherwise, go to 'begin'
    'begin', // 2: Stage started
    'main', // 3: Main execution
    'childBefore', // 4: Before child stage starts
    'childBegin', // 5: Child stage started
    'childMain', // 6: Child stage main execution
    'childEnd', // 7: Child stage ended
    'childAfter', // 8: After child stage ends
    'end', // 9: Finalization after main is completed
    'after', // 10: After main event is done / skipped
    'done' // 11: End state
 ] as const;

export default class Stage {
    #data: {
        arg: Dict;
        props: Dict;
        history: Dict<Plain>[]; // Stack of previous stages
        running: Stage[]; // Stack of currently running child stages
        parent: Stage | null;
        source: Stage | null;
        status: number; // Index in stageStatus
        step: number; // Current step in running[]
        result?: Dict; // Return value of run(), null if stage not finished
        cancelled?: true; // Whether the stage ends early because condition is no longer met, e.g. draw 0 cards or target died
        skipped?: true; // Whether the stage is skipped (called in the before step)
        executing?: string; // Name of the current executing function if not main
    };

    // // Reference to the Server instance
    // #server: Server;

    // Stage status
    get status() {
        return stageStatus[this.#data.status];
    }

    // Stage execution result
    get result() {
        return this.#data.result;
    }

    // Stage execution finished
    get done() {
        return this.status === 'done';
    }

    constructor({ data, init }: EntityAPI, parent: Stage | null, source: Stage | null, arg?: Dict) {
        // Initialize component properties
        this.#data = data;
        // this.#server = server;

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
        data.status = 0;
        data.step = 0;
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
