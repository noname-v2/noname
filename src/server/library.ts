import stages from '../build/stages';
import components from '../build/components';
import entities from '../build/entities';

import Component from "./component";
import Stage from "./stage";
import { apply, isDict } from '../utils';
import type Server from './server';

// Class for storing all extension definitions
export default class Library {
    // Reference to the Server instance
    #server: Server;

    // Counter for generating unique entity IDs
    #count = 1;

    // Dict of type name -> entity class
    #classes: Dict<any> = {
        component: Component,
        stage: Stage,
    };

    // Dict of type name -> tag name -> tag definition
    #refs: Extension = {component: {}};

    // Map from entity to its data
    // [0]: unique id
    // [1]: entity type
    // [2]: tag name to locate the entity definition given the type
    // [3]: entity data
    #instances = new WeakMap<any, [string, string, string | null, Dict<any>]>();

    constructor(server: Server) {
        this.#server = server;
        // Load built-in extensions
        stages.forEach(ext => this.load(ext));
        components.forEach(ext => this.load(ext));
        entities.forEach(ext => this.load(ext));
    }

    // Whether target entity exists
    has(target: any) {
        return this.#instances.has(target);
    }

    // Delete the reference to an entity
    delete(target: any) {
        this.#instances.delete(target);
    }

    // Get ID of an entity
    id(target: any) {
        return this.#instances.get(target)?.[0] as string;
    }

    // Get type of an entity
    type(target: any) {
        return this.#instances.get(target)?.[1];
    }

    // Get tag name of an entity
    tag(target: any) {
        return this.#instances.get(target)?.[2];
    }

    // Get data of an entity, newly registered data has higher priority
    get(target: any, key: string) {
        return this.#instances.get(target)?.[3][key];
    }

    // Set data of an entity
    set(target: any, key: string, value: any) {
        const entry = this.#instances.get(target);
        if (entry) {
            entry[3][key] = value;
        }
    }

    // Get the definitions of an entity
    ref(target: any) {
        return this.#refs[this.type(target)!]?.[this.tag(target)!];
    }

    // Gather styles from this.#refs.component
    refs<K extends keyof Extension>(type: string): Extension[K] {
        return this.#refs[type];
    }

    // Create and register an entity object by passing init to the constructor
    create(type: string, tag: string | null = null, ...args: any[]) {
        // Create an entity and pass data
        const data = {};
        const id = (this.#count++).toString();
        const api: EntityAPI = {
            data,
            server: this.#server,
            init: target => {
                // Save entity info
                this.#server.log(`Created ${type} with tag=${tag}, id=${id}`);
                this.#instances.set(target, [id, type, tag, data]);
                return false;
            },
        };
        if (isDict(this.#refs[type]) && tag && tag in this.#refs[type]) {
            api['ref'] = this.#refs[type][tag];
        }
        return new this.#classes[type](api, ...args);
    }

    // Import definitions from an extension
    load(ext: Extension) {
        for (let section in ext) {
            if (section === 'entity') {
                apply(this.#classes, ext.entity!);
            }
            else if (isDict(ext[section])) {
                if (!(section in this.#refs)) {
                    this.#refs[section] = {};
                }
                apply(this.#refs[section], ext[section]);
            }
        }
    }
}