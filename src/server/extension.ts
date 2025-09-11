import { isCapatalized, unCapitalize } from "../utils";
import { wrapComponent } from "./component";
import Component from "./component";
import Entity from "./entity";
import Stage from "./stage";

// global state object
const stateEntity = new Entity();
const state = stateEntity.createProxy();

// object storing class definitions
const lib = new Map<ComponentType | StageType | EntityType, UI | Stages | Entities>([
    [Component, { Component }],
    [Stage, { Stage }],
    [Entity, { Entity }]
]);

// read-only getters for Component classes and ComponentCreator functions
const ui = new Proxy(lib.get(Component) as UI, {
    get: function (target, prop: Capitalize<string> | Uncapitalize<string>) {
        return target[prop];
    }
});

// read-only getters for Stage classes
const stages = new Proxy(lib.get(Stage) as Stages, {
    get: function (target, prop: Capitalize<string>) {
        return target[prop];
    }
});

// read-only getters for Entity classes
const entities = new Proxy(lib.get(Entity) as Entities, {
    get: function (target, prop: Capitalize<string>) {
        return target[prop];
    }
});

/*
 * Import an extension of <Component | Stage | Entity>.
 */
export default function importExtension(ext: Extension) {
    const defs = ext({ ui, stages, entities, state });

    for (const name in defs) {
        if (!isCapatalized(name)) {
            continue;
        }
        const cls = defs[name];

        // select the correct destination from lib for extension-defined class
        for (const [libCls, dict] of lib.entries()) {
            if (cls.prototype instanceof libCls) {
                if (name in dict && !(cls.prototype instanceof dict[name])) {
                    // attempting to extend incompatible class
                    throw new Error(`${name} already defined`);
                }
                dict[name] = cls;

                // method to create child components inside Component.render(), e.g. ui.app()
                if (libCls === Component) {
                    (dict as UI)[unCapitalize(name)] = wrapComponent(cls as ComponentType);
                }
                break;
            }
        }
    }
}