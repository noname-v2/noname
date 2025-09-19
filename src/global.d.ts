import type _Component from './server/component';
import type _Stage from './server/stage';
import type _Entity from './server/entity';
import type _Callbacks from './client/element';
import type { Logger } from './logger';

declare global {
    // Plain object
    type Plain = number | string | boolean | null | Plain[] | { [key: string]: Plain };
    type Dict<T=Plain> = {[key: string]: T};

    // CSS declaration
    type CSSDict = Partial<CSSStyleDeclaration>;

    // Update to an HTML element
    // key: Component ID
    // 'x': delete entire subtree
    // `dur:${string}`: set global duration multiplier
    // ComponentProps: update properties only
    // [ComponentProps, string, string]:
    // [0]: Updated properties
    // [1]: Parent component ID, '-' if detached
    // [2]: HTML element tag
    type ElementUpdate = 'x' | `dur:${string}` | ElementProps | [ElementProps, string, string];

    // UI updates pending to be sent to main thread
    // key: Component ID
    // string: Parent component ID of new / moved component, '-' if detached, 'x' if unlinked
    // ComponentProps: Update component properties
    type ComponentUpdate = string | ComponentProps;

    // Properties for client Factory to process
    interface ElementProps {
        style?: CSSDict; // HTML element CSS style
        dataset?: Dict<string>; // HTML element dataset
        className?: string; // HTML element class name
        innerHTML?: string; // innerHTML of the component, no other children allowed if set
        x?: number;
        y?: number;
        z?: number;
        opacity?: number;
        scale?: number;
        scaleX?: number;
        scaleY?: number;
        scaleZ?: number;
        rotate?: number;
        rotateX?: number;
        rotateY?: number;
        rotateZ?: number;
        transition?: number // transition duration (value x global_duration) for properties change
    }

    // Properties for server sync() to process into ElementProps
    interface ComponentProps extends ElementProps {
        exclusive?: string[]; // client ids that can see this component, undefined or empty for all
        slot?: number; // slot index as identifier when siblings have the same tag
        left?: number | null;
        top?: number | null;
        right?: number | null;
        bottom?: number | null;
        width?: number | null;
        height?: number | null;
        aspectRatio?: number | null;
        [key: string]: Plain; // other properties passed to the component (trigger re-render on change)
    }

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
    }

    // Return value of extension module function
    interface ExtensionObject {
        [key: Capitalize<string>]: ComponentType | StageType | EntityType;
    }

    // An extension module is a function that takes ExtensionAPI and returns new definitions
    type Extension = (api: ExtensionAPI) => ExtensionObject;

    // Argument passed to element extension module function that defines HTML element callbacks
    type ElementExtension = (logger: Logger, callbacks: Dict<_Callbacks>) => Dict<_Callbacks>;
}