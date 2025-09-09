import { isCapatalized } from "../utils";

// map from stage to its parent
const parents = new Map<Stage, Stage>();

// map from stage to child stages
const children = new Map<Stage, Stage[]>();

class Stage {
    run() {
        
    }
};

export type _Stage = Stage;
export type _StageType = typeof Stage;

/** Stages defined in the current scope. */
const dict = { Stage } as Stages;

/**
 * Define a stage.
 * @param target Stage class.
 * @param mode Permission of the stage defition.
 */
export function registerStage(name: string, target: typeof Stage) {
    if (!isCapatalized(name)) {
        throw new Error(`Stage name ${name} must be capatalized`);
    }

    if (name in dict) {
        // extend existing stage if applicable
        if (target.prototype instanceof dict[name]) {
            dict[name] = target;
        }
        else {
            throw new Error(`Stage ${name} already defined`);
        }
    }
    else {
        dict[name] = target;
    }
}

/** Read-only UI getter for extensions. */
export const stages = new Proxy(dict, {
    get: function (target, prop: Capitalize<string>) {
        return target[prop];
    }
});
