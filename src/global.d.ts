import type _Component from './server/component';
import type _Stage from './server/stage';
import type _Entity from './server/entity';
import type _Callbacks from './client/element';

declare global {
    // Plain object
    type Plain = number | string | boolean | null | Plain[] | { [key: string]: Plain };
    type Dict<T=Plain> = {[key: string]: T};

    // CSS declaration
    type CSSDict = Partial<CSSStyleDeclaration>;

    // Update to an HTML element
    // 'x': delete entire subtree
    // ComponentProps: update properties only
    // [ComponentProps, string, string]:
    // [0]: Updated properties
    // [1]: Parent component ID, '-' if detached
    // [2]: HTML element tag
    type ElementUpdate = 'x' | ComponentProps | [ComponentProps, string, string];

    interface ComponentProps {
        style?: CSSDict; // HTML element CSS style
        dataset?: Dict; // HTML element dataset
        className?: string; // HTML element class name
        exclusive?: string[]; // client ids that can see this component, undefined or empty for all
        slot?: number; // slot index as identifier when siblings have the same tag
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
        left?: number;
        top?: number;
        right?: number;
        bottom?: number;
        width?: number;
        height?: number;
        aspectRatio?: number;
        [key: string]: Plain; // other properties passed to the component (trigger re-render on change)
    }

    // Type for a function that returns component instance.
    // string: innerHTML
    // number: slot id for parent render() to identify
    // Component: child component
    // Partial<ComponentProps>: component properties
    type ComponentMaker = (...args: (string | number | Component | Component[] | Partial<ComponentProps>)[]) => Component;

    // /** Properties assignable to FC. */
    // type FCProps = {
    //     // unique identifier of the component
    //     cid?: string;

    //     // animation state of the component, triggers an animation whenever value changes
    //     animate?: string;

    //     // bind a click and/or move event to the component, overwrites the bind() inside the component FC
    //     bind?: BindConfig;

    //     // customize the definition of child components
    //     deviate?: Dict<(props: Dict) => JSX.Element>;

    //     [key: string]: any;
    // };

    // /** Function component with synced state. */
    // type FC = (data: FCProps, api: StateAPI) => JSX.Element;

    // /** A module that exports function component. */
    // type FCM = {
    //     // function component(s)
    //     [key: CapString]: FC;

    //     // component style sheet
    //     css?: CSSDict;

    //     // reusable styles defined by the component
    //     mixin?: Dict<Dict<CSSValue>>;
    // }

    // /** Stage main function. */
    // type SF = (data: Dict, api: StageAPI) => any;

    // /** A module that exports function component. */
    // type SFM = {
    //     [key: string]: SF;
    // };

    /** Type for point location */
    type Point = {x: number, y: number};

    /** Type for an area */
    type Region = {x: [number, number], y: [number, number]};

    // component type
    type Component = _Component;
    type ComponentType = typeof _Component;

    type Stage = _Stage;
    type StageType = typeof _Stage;

    // entity type
    type Entity = _Entity;
    type EntityType = typeof _Entity;
    type EntityData = Plain | Map | Set | Entity | EntityData[] | { [key: string]: EntityData };

    /** Type for APIs. */
    interface UI {
        [key: Uncapitalize<string>]: ComponentMaker;
    }

    interface Components {
        [key: Capitalize<string>]: ComponentType;
    }

    interface Stages {
        [key: Capitalize<string>]: StageType;
    }

    interface Entities {
        [key: Capitalize<string>]: EntityType;
    }

    // Argument passed to extension module function
    interface ExtensionAPI {
        ui: UI;
        components: Components;
        stages: Stages;
        entities: Entities;
        state: Dict<EntityData>;
    }

    // Return value of extension module function
    interface ExtensionObject {
        [key: Capitalize<string>]: ComponentType | StageType | EntityType;
    }

    // An extension module is a function that takes ExtensionAPI and returns new definitions
    type Extension = (api: ExtensionAPI) => ExtensionObject;

    // Argument passed to element extension module function that defines HTML element callbacks
    type ElementExtension = (callbacks: Dict<_Callbacks>) => Dict<_Callbacks>;
}