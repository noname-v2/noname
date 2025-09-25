import stages from '../build/stages';
import components from '../build/components';
import entities from '../build/entities';

import { createRoot, config } from './tree';
import { toKebab } from "../utils";
import { getMaker, toCSS, defaultCSS } from "./component";
import logger from '../logger';

export default class Server {
    // Internal object storing definitions
    #ui = {} as UI;
    #components = {} as Dict<ComponentDefinition>;
    #stages = {} as Dict<StageDefinition>;
    #entities = {} as Dict<EntityDefinition>;

    // Component creation for render()
    ui = new Proxy(this.#ui, {
        get: (target, prop: string) => {
            if (!(prop in target)) {
                target[prop] = getMaker(prop, { native: true }, this.ui);
            }
            return target[prop];
        }
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
        createRoot(this.ui.app(), this);
        // from here: init stages, load state, etc.

        const css: Dict<CSSDict> = {}; // styles from static css property
        const mixin: Dict<Set<string>> = {}; // mixin group name from static mixin property
        const native: Dict<boolean> = {}; // whether to add 'nn-' prefix to final tag name
        const styles: Dict<CSSDict> = {}; // combined css and mixins

        // Gather styles from all components by tag name
        for (const tagName in this.#components) {
            const cls = this.#components[tagName as Capitalize<string>];
            native[tagName] = cls.native || false;
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
        for (const tagName in css) {
            let selector = tagName;
            mixin[tagName]?.forEach(m => {
                selector += `,${m}`;
            });
            styles[selector] = css[tagName];

            // Fill default styles from Component.css
            for (const m in defaultCSS) {
                if (!(m in styles[selector])) {
                    (styles as any)[selector][m] = (defaultCSS as any)[m];
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
        // Check duplicate definition before applying any changes
        this.#walkDefs(ext, true);
        // Apply definitions from the extension
        this.#walkDefs(ext, false);
    }

    // Set message handler for client messages
    onmessage(callback: (msg: ElementResponse) => void) {
        // from here: route messages to correct client if multiple clients
        self.onmessage = ({data}) => {
            logger.log('Received message:', data);
            callback(data as ElementResponse);
        };
    }

    // Iterate over extension object definitions
    #walkDefs(ext: Extension, check_only: boolean) {
        // Define new components
        for (const name in ext.components) {
            const def = ext.components[name];
            const tagName = (def.native ? '' : 'nn-') + toKebab(name);
            if (check_only) {
                if (tagName in this.#components) {
                    throw new Error(`${tagName} already defined`);
                }
            }
            else {
                this.#components[tagName] = def;
                const maker = getMaker(tagName, def, this.ui);
                this.#ui[tagName] = maker;
                this.#ui[name] = maker; // also allow access by original name
            }
        }

        // Define new stages / entities
        for (const [section, target] of [['stages', this.#stages], ['entities', this.#entities]] as const) {
            for (const name in ext[section]) {
                if (check_only) {
                    if (name in target) {
                        throw new Error(`${name} already defined`);
                    }
                }
                else {
                    target[name] = ext[section][name];
                }
            }
        }
    }
}