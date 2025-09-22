import type _Component from './server/component';
import type _Stage from './server/stage';
import type _Entity from './server/entity';
import type _Callbacks from './client/element';
import type { dimensionProps, eventHandlers, elementProps, nodeProps } from './constants';
import type { Logger } from './logger';

declare global {
    // Plain object
    type Plain = number | string | boolean | null | Plain[] | { [key: string]: Plain };
    type Dict<T=Plain> = {[key: string]: T};

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

    // Callback for click events
    // 'right': right click or press and hold
    // 'double': double click / double tap
    // 'down': mouse down or touch start
    // null: regular left click / tap
    type ClickCallback = (type: 'right' | 'double' | 'down' | null = null) => void;

    // Properties for server sync() to process into ElementProps
    type ComponentProps = ElementProps & DimensionProps & NodeProps;

    // Type for a function that returns component instance.
    // string: innerHTML
    // number: slot id for parent render() to identify
    // Component: child component
    // Partial<ComponentProps>: component properties
    type ComponentMaker = (...args: (string | number | Component | Component[] | Partial<ComponentProps>)[]) => Component;

    // Component type
    type Component = _Component;
    type ComponentType = typeof _Component;

    type Stage = _Stage;
    type StageType = typeof _Stage;

    // Entity type
    type Entity = _Entity;
    type EntityType = typeof _Entity;
    type EntityData = Plain | Map | Set | Entity | EntityData[] | { [key: string]: EntityData };

    // Argument passed to extension module function
    interface ExtensionAPI {
        ui: { [key: Uncapitalize<string>]: ComponentMaker; };
        components: { [key: Capitalize<string>]: ComponentType; };
        stages: { [key: Capitalize<string>]: StageType; };
        entities: { [key: Capitalize<string>]: EntityType; };
        state: Dict<EntityData>;
        logger: Logger;
        Component: ComponentType;
        Stage: StageType;
        Entity: EntityType;
    }

    // Return value of extension module function
    interface ExtensionObject {
        [key: Capitalize<string>]: ComponentType | StageType | EntityType;
    }

    // An extension module is a function that takes ExtensionAPI and returns new definitions
    type Extension = (api: ExtensionAPI) => ExtensionObject;

    // Argument passed to element extension module function that defines HTML element callbacks
    type ElementExtension = (api: Dict<_Callbacks> & { logger: Logger }) => Dict<_Callbacks>;
}