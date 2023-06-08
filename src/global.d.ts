import type { ClientAPI } from './client/ui';
import type { StageAPI } from './worker/stage';
import type { BindConfig } from './client/bind';

declare global {
    /** Plain object. */
    type Dict<T=any> = {[key: string]: T};

    /** Function component with synced state. */
    type FC = (data: {cid?: string, state?: string, bind?: BindConfig, [key: string]: any}, api: ClientAPI) => JSX.Element;

    /** Stage main function. */
    type SF = (data: Dict, api: StageAPI) => any;

    /** Type for point location */
    type Point = {x: number, y: number};

    /** Type for an area */
    type Region = {x: [number, number], y: [number, number]};
}