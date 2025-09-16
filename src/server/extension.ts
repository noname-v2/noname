import { isCapatalized, toSnake } from "../utils";
import { getMaker } from "./component";
import Component from "./component";
import Entity from "./entity";
import Stage from "./stage";

// global state object
const stateEntity = new Entity();
const state = stateEntity.createProxy();

// internal object storing data for getters
const lib = {
    ui: {} as UI,
    components: { Component } as Components,
    stages: { Stage } as Stages,
    entities: { Entity } as Entities
};

const libMap = new Map<ComponentType | StageType | EntityType, Components | Stages | Entities>([
    [Component, { Component }],
    [Stage, { Stage }],
    [Entity, { Entity }]
]);

// object storing ComponentMaker functions
export const ui = new Proxy(lib.ui, {
    get: function (target, prop: Uncapitalize<string>) {
        return target[prop];
    }
});

// read-only getters for Component classes and ComponentMaker functions
export const components = new Proxy(lib.components, {
    get: function (target, prop: Capitalize<string>) {
        return target[prop];
    }
});

// read-only getters for Stage classes
export const stages = new Proxy(lib.stages, {
    get: function (target, prop: Capitalize<string>) {
        return target[prop];
    }
});

// read-only getters for Entity classes
export const entities = new Proxy(lib.entities, {
    get: function (target, prop: Capitalize<string>) {
        return target[prop];
    }
});

// Iterate over extension object definitions
function walkDefs(defs: ExtensionObject, check_only: boolean) {
    for (const name in defs) {
        if (!isCapatalized(name)) {
            continue;
        }
        const cls = defs[name];

        // select the correct destination from lib for extension-defined class
        for (const [libCls, dict] of libMap.entries()) {
            if (cls.prototype instanceof libCls) {
                if (check_only) {
                    if (name in dict && !(cls.prototype instanceof dict[name])) {
                        // attempting to extend incompatible class
                        throw new Error(`${name} already defined`);
                    }
                }
                else {
                    dict[name] = cls;
                    if (libCls === Component) {
                        // method to create child components inside Component.render(), e.g. ui.app()
                        lib.ui[toSnake(name)] = getMaker(name, cls as ComponentType, ui);
                    }
                }
                break;
            }
        }
    }
}

/*
 * Import an extension of <Component | Stage | Entity>.
 */
export function importExtension(ext: Extension) {
    const defs = ext({ ui, components, stages, entities, state });

    // Check duplicate definition before applying any changes
    walkDefs(defs, true);

    // Apply definitions from the extension
    walkDefs(defs, false);
}