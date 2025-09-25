import type _Component from './server/component';
import type _Stage from './server/stage';
import type _Callbacks from './client/element';
import type { dimensionProps, eventHandlers, elementProps, nodeProps } from './constants';
import type { Logger } from './logger';

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
    type Component = _Component;
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
    type Stage = _Stage;
    interface StageDefinition {
        run?: (this: Stage, ...args: any[]) => Promise<void> | void;
    }

    // Type for custom objects that can be serialized and stored
    interface EntityAPI {
        data: Dict<any>;
    }
    interface EntityDefinition {
        [key: string]: (this: EntityAPI, ...args: any[]) => any; // Public properties
    }

    // An extension module is a function that takes ExtensionAPI and returns new definitions
    interface Extension {
        components?: Dict<ComponentDefinition>;
        stages?: Dict<StageDefinition>;
        entities?: Dict<EntityDefinition>;
    }

    // Argument passed to element extension module function that defines HTML element callbacks
    type ElementExtension = Dict<_Callbacks>;
}