import { isCapatalized, toSnake } from "../utils";
import { getMaker } from "./component";
import logger from '../logger';
import Component from "./component";
import Entity from "./entity";
import Stage from "./stage";

// Internal object storing data for getters
const lib = {
    ui: {},
    components: { Component },
    stages: { Stage },
    entities: { Entity },
    state: new Entity(),
    logger
} as ExtensionAPI;

// Map for possible extension-defined class types to their destination in lib
const clsMap = new Map<ComponentType | StageType | EntityType, ExtensionAPI['components' | 'stages' | 'entities']>([
    [Component, lib.components],
    [Stage, lib.stages],
    [Entity, lib.entities]
]);

// Read-only getters for ExtensionAPI
export const api = Object.freeze({
    ui: new Proxy(lib.ui, {
        get: function (target, prop: Uncapitalize<string>) {
            if (!(prop in target)) {
                target[prop] = getMaker(prop, Component, api.ui);
            }
            return target[prop];
        }
    }),
    components: new Proxy(lib.components, {
        get: function (target, prop: Capitalize<string>) {
            return target[prop];
        }
    }),
    stages: new Proxy(lib.stages, {
        get: function (target, prop: Capitalize<string>) {
            return target[prop];
        }
    }),
    entities: new Proxy(lib.entities, {
        get: function (target, prop: Capitalize<string>) {
            return target[prop];
        }
    }),
    state: lib.state.createProxy(),
    logger: lib.logger
});

// Iterate over extension object definitions
function walkDefs(defs: ExtensionObject, check_only: boolean) {
    for (const name in defs) {
        if (!isCapatalized(name)) {
            continue;
        }
        const cls = defs[name];

        // select the correct destination from lib for extension-defined class
        for (const [libCls, dict] of clsMap) {
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
                        lib.ui[toSnake(name)] = getMaker(name, cls as ComponentType, api.ui);
                    }
                }
                break;
            }
        }
    }
}

// Import an extension of <Component | Stage | Entity>.
export function importExtension(ext: Extension) {
    const defs = ext(api);

    // Check duplicate definition before applying any changes
    walkDefs(defs, true);

    // Apply definitions from the extension
    walkDefs(defs, false);
}
