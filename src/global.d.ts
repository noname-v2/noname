import type Component from './server/component';
import type Stage from './server/stage';
import type Channel from './server/channel';
import type Callbacks from './client/element';
import type { dimensionProps, eventHandlers, elementProps, nodeProps } from './constants';
import type Logger from './logger';

declare global {
    // Plain object
    type Plain = number | string | boolean | null | Plain[] | { [key: string]: Plain };
    type Dict<T = Plain> = { [key: string]: T };

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
    type ElementUpdate = 'x' | ElementProps | [ElementProps, string, string];

    interface ConfigUpdate {
        dur?: number; // global duration multiplier
        css?: string; // global CSS styles
    }

    interface ClientUpdate extends ConfigUpdate {
        [key: string]: ElementUpdate;
    }

    // UI updates pending to be sent to main thread
    // key: Component ID
    // string: Parent component ID of new / moved component, '-' if detached, 'x' if unlinked
    // ComponentProps: Update component properties
    type ComponentUpdate = string | ComponentProps;

    // Component / Element properties categoried by their usage
    type DimensionProps = Partial<typeof dimensionProps>;
    type ElementProps = Partial<typeof elementProps>;
    type NodeProps = Partial<typeof nodeProps> & Dict;
    type EventHandler = typeof eventHandlers[number];

    // Callback for element events
    // [0]: Element id
    // [1]: Name of the component method to be called
    // [2]: [x, y] position of the event
    type ElementResponse = [string, ElementProps[EventHandler], [number, number]];

    // Properties for server sync() to process into ElementProps
    type ComponentProps = ElementProps & DimensionProps & NodeProps;

    // Type for a function that returns component instance.
    // string: innerHTML
    // number: slot id for parent render() to identify
    // Component: child component
    // Partial<ComponentProps>: component properties
    type ComponentMaker = (...args: (string | number | Component | Component[] | Partial<ComponentProps>)[]) => Component;
    type UI = Dict<ComponentMaker>;
    interface ComponentDefinition {
        render?: (this: Component, ui: UI) => void;
        popup?: (this: Component, ui: UI) => void;
        css?: CSSDict;
        mixin?: string[];
        native?: boolean;
    }

    //  Stage type
    interface StageDefinition {
        run?: (this: Stage, ...args: any[]) => Promise<void> | void;
    }

    // Initialization function for the data of Entity / Component / Stage
    // If returns true, the instance is restored from saved state and does not need further initialization
    interface EntityAPI {
        init: (target: any) => boolean; // Initializes and returns whether entity is restored from previous state
        data: any; // Entity data
        ui: UI; // UI object for creating components
        ref?: any; // Reference to extension-defined definitions
        logger: Logger; // Logger instance
        channel: Channel; // Channel instance
    }

    // An extension module is a function that takes ExtensionAPI and returns new definitions
    interface Extension {
        component?: Dict<ComponentDefinition>;
        stage?: Dict<StageDefinition>;
        hero?: Dict<any>;
        card?: Dict<any>;
        skill?: Dict<any>;
        token?: Dict<any>;
        permanent?: Dict<any>;
        entity?: (api: any) => Dict<any>;
        [key: string]: Dict<any>;
    }

    // Argument passed to element extension module function that defines HTML element callbacks
    type ElementExtension = Dict<Callbacks>;

    // Client constructor options
    interface ClientOptions {
        debug?: boolean; // whether to enable debug mode
    }

    // Server constructor options
    interface ServerOptions {
        dur?: number; // global duration multiplier
        debug?: boolean; // whether to enable debug mode
        channel?: string; // Channel type ('websocket' or 'worker')
    }
}