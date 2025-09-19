import logger from '../logger';

// unique entity ID
let entityCount = 0;

export default class Entity {
    #id = entityCount++;

    #data: Dict<EntityData> = {};

    get id() {
        return this.#id;
    }

    createProxy(readOnly: boolean = false): Dict<EntityData> {
        return new Proxy(this.#data, {
            get(target, prop, receiver) {
                // intercept property access
                return Reflect.get(target, prop, receiver);
            },
            set(target, prop, value, receiver) {
                // intercept property assignment
                if (readOnly) {
                    logger.warn("Cannot modify read-only proxy");
                    return false;
                }
                else {
                    return Reflect.set(target, prop, value, receiver);
                }
            }
        });
    }
}
