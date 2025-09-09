import type { _Component, _ComponentType } from './server/component';
import type { _Stage, _StageType } from './server/stage';
import type { _Entity, _EntityType, _EntityData } from './server/entity';
import type { State } from './server/state';

declare global {
    /** Plain object. */
    type Plain = number | string | boolean | null | Plain[] | { [key: string]: Plain };
    type Dict<T=Plain> = {[key: string]: T};

    /** CSS values (number is converted to px, array is joined with a space). */
    type CSSValue = number | string | (string | number)[];

    /** Dict with a scss-like way to represent CSS. */
    type CSSDict = { [key: string]: CSSValue | CSSDict }

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

    /** Type for a component. */
    type Component = _Component;
    type ComponentType = _ComponentType;

    type Stage = _Stage;
    type StageType = _StageType;

    type Entity = _Entity;
    type EntityType = _EntityType;
    type EntityData = _EntityData;

    /** Type for a function that returns component instance. */
    type ComponentCreator = (...args: (Component | Dict)[]) => Component;

    /** Type for APIs. */
    interface UI {
        [key: Capitalize<string>]: ComponentType;
        [key: Uncapitalize<string>]: ComponentCreator;
    }

    interface Stages {
        [key: Capitalize<string>]: StageType;
    }

    interface Entities {
        [key: Capitalize<string>]: EntityType;
    }

    /** Type for a extension */
    interface ExtensionObject {
        ui?: {[key: Capitalize<string>]: ComponentType};
        stages?: {[key: Capitalize<string>]: StageType};
        entities?: {[key: Capitalize<string>]: EntityType};
    }

    type Extension = ({ ui: UI, stages: Stages, entities: Entities }) => ExtensionObject;
}