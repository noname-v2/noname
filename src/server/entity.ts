// unique entity ID
let entityCount = 1;

// Classes with serializable data
export default class Entity {
    // Unique entity ID
    #id = (entityCount++).toString();

    get id() {
        return this.#id;
    }
}
