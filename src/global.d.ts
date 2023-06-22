import type { StateAPI } from './client/state';
import type { StageAPI } from './worker/stage';
import type { BindConfig } from './client/bind';

declare global {
    /** Capatalized string. */
    type CapString = `${Uppercase<string>}${string}`;

    /** Plain object. */
    type Dict<T=any> = {[key: string]: T};

    /** CSS values (number is converted to px, array is joined with a space). */
    type CSSValue = number | string | (string | number)[];

    /** Dict with a scss-like way to represent CSS. */
    type CSSDict = { [key: string]: CSSValue | CSSDict }

    /** Properties assignable to FC. */
    type FCProps = {
        // unique identifier of the component
        cid?: string;

        // animation state of the component, triggers an animation whenever value changes
        animate?: string;

        // bind a click and/or move event to the component, overwrites the bind() inside the component FC
        bind?: BindConfig;

        // customize the definition of child components
        deviate?: Dict<(props: Dict) => JSX.Element>;

        [key: string]: any;
    };

    /** Function component with synced state. */
    type FC = (data: FCProps, api: StateAPI) => JSX.Element;

    /** A module that exports function component. */
    type FCM = {
        // function component(s)
        [key: CapString]: FC;

        // component style sheet
        css?: CSSDict;

        // reusable styles defined by the component
        mixin?: Dict<Dict<CSSValue>>;
    }

    /** Stage main function. */
    type SF = (data: Dict, api: StageAPI) => any;

    /** A module that exports function component. */
    type SFM = {
        [key: string]: SF;
    };

    /** Type for point location */
    type Point = {x: number, y: number};

    /** Type for an area */
    type Region = {x: [number, number], y: [number, number]};
}