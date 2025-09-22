import stages from '../build/stages';
import components from '../build/components';
import entities from '../build/entities';

import { createRoot, config } from './tree';
import { isCapatalized, toKebab, toSnake } from "../utils";
import { getMaker, toCSS } from "./component";
import Component from "./component";
import Entity from "./entity";
import Stage from "./stage";
import logger from '../logger';

export default class Server {
    // Internal object storing extension definitions
    #ui = {} as ExtensionAPI['ui'];
    #components = { Component } as ExtensionAPI['components'];
    #stages = { Stage } as ExtensionAPI['stages'];
    #entities = { Entity } as ExtensionAPI['entities'];
    #state = new Entity(); // from here: dedicated State object with method create('card'), etc?

    // API object passed to extension modules
    #api: ExtensionAPI = Object.freeze({
        ui: new Proxy(this.#ui, {
            get: (target, prop: Uncapitalize<string>) => {
                if (!(prop in target)) {
                    target[prop] = getMaker(prop, Component, this.#api.ui);
                }
                return target[prop];
            }
        }),
        components: new Proxy(this.#components, {
            get: (target, prop: Capitalize<string>) => {
                return target[prop];
            }
        }),
        stages: new Proxy(this.#stages, {
            get: (target, prop: Capitalize<string>) => {
                return target[prop];
            }
        }),
        entities: new Proxy(this.#entities, {
            get: (target, prop: Capitalize<string>) => {
                return target[prop];
            }
        }),
        state: this.#state.createProxy(), logger,
        Component, Stage, Entity
    });

    // Connected clients
    clients = new Set<string>();

    // Start the server
    start() {
        // Load built-in extensions
        stages.forEach(ext => this.importExtension(ext));
        components.forEach(ext => this.importExtension(ext));
        entities.forEach(ext => this.importExtension(ext));

        // Initialize the root stage and component
        logger.log('Server started');
        this.createClient('self');
        createRoot(this.#api.ui.app(), this);
        // from here: init stages, load state, etc.

        const css: Dict<CSSDict> = {}; // styles from static css property
        const mixin: Dict<Set<string>> = {}; // mixin group name from static mixin property
        const native: Dict<boolean> = {}; // whether to add 'nn-' prefix to final tag name
        const styles: Dict<CSSDict> = {}; // combined css and mixins

        // Gather styles from all components by tag name
        for (const name in this.#components) {
            const cls = this.#components[name as Capitalize<string>];
            const tagName = toKebab(name);
            native[tagName] = cls.native;
            if (cls.css) {
                css[tagName] = cls.css;
            }
            cls.mixin?.forEach(m => {
                if (!mixin[m]) {
                    mixin[m] = new Set();
                }
                mixin[m].add(tagName);
            });
        }

        // Combine css and mixins into final styles
        const toSelector = (tag: string) => (native[tag] ? '' : 'nn-') + toKebab(tag);
        for (const tagName in css) {
            let selector = toSelector(tagName);
            mixin[tagName]?.forEach(m => {
                selector += `,${toSelector(m)}`;
            });
            styles[selector] = css[tagName];

            // Fill default styles from Component.css
            for (const m in Component.css) {
                if (!(m in styles[selector])) {
                    (styles as any)[selector][m] = (Component as any).css[m];
                }
            }
        }

        // Add static style properties from components
        // from here: add static width(), height(), etc.

        // Convert and send CSS styles to clients
        const styleString = toCSS(styles);
        logger.log(styleString);
        config({'css': styleString});
    }

    // Send data to a client
    send(id: string, data: any) {
        if (!this.clients.has(id)) {
            return;
        }
        self.postMessage(data);
    }

    // Send data to all clients
    broadcast(data: any) {
        self.postMessage(data);
    }

    // Add a new client connection
    createClient(id: string) {
        this.clients.add(id);
    }

    // Import an extension of <Component | Stage | Entity>.
    importExtension(ext: Extension) {
        const defs = ext(this.#api);
        // Check duplicate definition before applying any changes
        this.#walkDefs(defs, true);
        // Apply definitions from the extension
        this.#walkDefs(defs, false);
    }

    // Get storage object from extension class
    #clsMap(cls: ComponentType | StageType | EntityType) {
        if (cls.prototype instanceof Component) {
            return this.#components;
        }
        if (cls.prototype instanceof Stage) {
            return this.#stages;
        }
        if (cls.prototype instanceof Entity) {
            return this.#entities;
        }
        return null;
    }

    // Iterate over extension object definitions
    #walkDefs(defs: ExtensionObject, check_only: boolean) {
        for (const name in defs) {
            if (!isCapatalized(name)) {
                continue;
            }
            // Select the correct destination from lib for extension-defined class
            const cls = defs[name];
            const dict = this.#clsMap(cls);
            if (dict) {
                // clsMap -> #apply
                if (check_only) {
                    if (name in dict && !(cls.prototype instanceof dict[name])) {
                        // Attempting to extend incompatible class
                        throw new Error(`${name} already defined`);
                    }
                }
                else {
                    dict[name] = cls;
                    if (dict === this.#components) {
                        // Method to create child components inside Component.render(), e.g. ui.app()
                        this.#ui[toSnake(name)] = getMaker(name, cls as ComponentType, this.#api.ui);
                    }
                }
            }
        }
    }
}