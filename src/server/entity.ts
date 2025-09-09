import { isCapatalized } from "../utils";

// from here: global game object that stores current game status (all data except for stages)
class Entity {
    createProxy() {
        return new Proxy(this, {
            get(target, prop, receiver) {
                // intercept property access
                return Reflect.get(target, prop, receiver);
            },
            set(target, prop, value, receiver) {
                // intercept property assignment
                return Reflect.set(target, prop, value, receiver);
            }
        });
    }
}

export type _Entity = Entity;
export type _EntityType = typeof Entity;

/** Stages defined in the current scope. */
const dict = { Entity } as Entities;

/**
 * Define a stage.
 * @param target Stage class.
 * @param mode Permission of the stage defition.
 */
export function defineEntity(name: string, target: EntityType) {
    if (!isCapatalized(name)) {
        throw new Error(`Entity name ${name} must be capatalized`);
    }

    if (name in dict) {
        // extend existing stage if app licable
        if (target.prototype instanceof dict[name]) {
            dict[name] = target;
        }
        else {
            throw new Error(`Entity ${name} already defined`);
        }
    }
    else {
        dict[name] = target;
    }
}

/** Read-only UI getter for extensions. */
export const entities = new Proxy(dict, {
    get: function (target, prop: Capitalize<string>) {
        return target[prop];
    }
});