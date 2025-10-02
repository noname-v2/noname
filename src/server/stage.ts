import type Server from "./server";
import { apply } from "../utils";

const stageStatus = {
    null: 0, // Not started
    before: 1, // Pre-stage, go to 'skip' if skip() is called, otherwise, go to 'begin'
    begin: 2, // Stage started, go to 'cancel' if main becomes a null operation (e.g. draw 0 card), otherwise, go to 'main'
    main: 3, // Main execution, go to 'cancel' if condition is no longer met during execution (e.g. target died), otherwise, go to 'end'
    end: 4, // Finalization after main is completed
    after: 5, skip: 5, cancel: 5,// After main event is done / skipped / cancelled
    done: 6, skipped: 6, cancelled: 6 // End state
} as const;

export default class Stage {
    #data: {
        args: any[];
        props: Dict<any>;
        children: Stage[];
        parent: Stage | null;
        source: Stage | null;
        status: keyof typeof stageStatus;
        step: number;
    };

    // Reference to the Server instance
    #server: Server;

    constructor({ data, server, init }: EntityAPI, ...args: any[]) {
        // Initialize component properties
        this.#data = data;
        this.#server = server;

        if (init(this)) {
            // Restored from saved state and does not need initialization
            return;
        }
        // Initialize component data
        data.args = args;
        data.props = {};
        data.children = [];
        data.parent = null;
        // data.source = server.current;
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
        return this.#data.props[key];
    }

    // Add and run a child stage
    async next(tag: string, ...args: any[]) {
        const lib = this.#server.lib;
        const child = lib.create('stage', tag, ...args);
        return child;
        // this.#data.children.push(stage);
        // stage.#data.parent = this;
        // this.#server.tree.unsynced.add(stage);
        // this.#server.tree.tick(stage, '-');
        // return stage.run(...stage.#data.args);
    }
};
