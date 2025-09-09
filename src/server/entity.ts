import { isCapatalized } from "../utils";

// entity data type
type EntityData = Plain | Entity | EntityData[] | { [key: string]: EntityData };

// unique entity ID
let entityCount = 0;

class Entity {
    #id = entityCount++;

    #data: Dict<EntityData> = {};

    get id() {
        return this.#id;
    }

    createProxy(readOnly: boolean = false): EntityData {
        return new Proxy(this.#data, {
            get(target, prop, receiver) {
                // intercept property access
                return Reflect.get(target, prop, receiver);
            },
            set(target, prop, value, receiver) {
                // intercept property assignment
                if (readOnly) {
                    throw new Error("Cannot modify read-only proxy");
                }
                return Reflect.set(target, prop, value, receiver);
            }
        });
    }
}

export type _Entity = Entity;
export type _EntityType = typeof Entity;
export type _EntityData = EntityData;

/** Stages defined in the current scope. */
const dict = { Entity } as Entities;

/**
 * Define a stage.
 * @param target Stage class.
 * @param mode Permission of the stage defition.
 */
export function registerEntity(name: string, target: EntityType) {
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

// read-only Entity class getter for extensions
export const entities = new Proxy(dict, {
    get: function (target, prop: Capitalize<string>) {
        return target[prop];
    }
});

// global state object
const stateEntity = new Entity();
export const state = stateEntity.createProxy();
