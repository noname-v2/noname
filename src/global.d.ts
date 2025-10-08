import type Component from './server/component';
import type Stage from './server/stage';
import type Channel from './server/channel';
import type Callbacks from './client/element';
import type Server from './server/server';
import type { dimensionProps, eventHandlers, elementProps, nodeProps } from './constants';
import type Logger from './logger';
import type { ChannelName } from './server/channel';

declare global {
    // Plain object
    type Plain = number | string | boolean | null | Plain[] | { [key: string]: Plain };
    type Dict<T = any> = { [key: string]: T };

    // CSS declaration
    type CSSDict = Partial<CSSStyleDeclaration> | { [key: string]: CSSDict };

    // Update to an HTML element
    // key: Component ID
    // 'x': delete entire subtree
    // ComponentProps: update properties only
    // [ComponentProps, string, string]:
    // [0]: Updated properties
    // [1]: Parent component ID, '-' if detached
    // [2]: HTML element tag
    interface ClientUpdate {
        dur?: number; // global duration multiplier
        css?: string; // global CSS styles
        [key: string]: 'x' | ElementProps | [ElementProps, string, string];
    }
    
    // Component / Element properties categoried by their usage
    type ElementProps = Partial<typeof elementProps>;
    type EventHandler = typeof eventHandlers[number];

    // Callback for element events
    // [0]: Element id
    // [1]: Name of the component method to be called
    // [2]: [x, y] position of the event
    type ElementResponse = [string, ElementProps[EventHandler], [number, number]];

    // Properties for server sync() to process into ElementProps
    type ComponentProps = ElementProps & Partial<typeof dimensionProps> & Partial<typeof nodeProps> & Dict;

    // Type for a function that returns component instance.
    // string: innerHTML
    // number: slot id for parent render() to identify
    // Component: child component
    // Partial<ComponentProps>: component properties
    type UI = Dict<(...args: (string | number | Component | Component[] | Partial<ComponentProps>)[]) => Component>;
    interface ComponentDefinition {
        render?: (this: Component, ui: UI) => void;
        popup?: (this: Component, ui: UI) => void;
        css?: CSSDict;
        mixin?: string[];
        native?: boolean;
    }

    //  Stage type
    type StageFunction = (this: Stage) => Promise<any> | any;
    interface StageDefinition {
        main: StageFunction; // Main execution function
        [key: string]: StageFunction; // Conditional execution branches activated by this.goto()
    }

    // Initialization function for the data of Entity / Component / Stage
    // If returns true, the instance is restored from saved state and does not need further initialization
    interface EntityAPI {
        init: (target: any) => boolean; // Initializes and returns whether entity is restored from previous state
        data: any; // Entity data
        ref?: any; // Reference to extension-defined definitions
        server: Server; // Server instance
    }

    // An extension module is a function that takes ExtensionAPI and returns new definitions
    interface Extension {
        component?: Dict<ComponentDefinition>;
        stage?: Dict<StageDefinition>;
        hero?: Dict;
        card?: Dict;
        skill?: Dict;
        token?: Dict;
        permanent?: Dict;
        entity?: (api: any) => Dict;
        [key: string]: Dict;
    }

    // Argument passed to element extension module function that defines HTML element callbacks
    type ElementExtension = Dict<Callbacks>;

    // Channel event types
    type ChannelEvent = 'open' | 'close' | 'message' | 'error';

    // Client constructor options
    interface ClientOptions {
        debug?: boolean; // whether to enable debug mode
    }

    // Server constructor options
    interface ServerOptions {
        dur?: number; // global duration multiplier
        debug?: boolean; // whether to enable debug mode
        channel?: ChannelName; // Base server type ('ws' or 'worker')
        timeout?: number; // Maximum ping interval in ms before disconnecting client
    }
}