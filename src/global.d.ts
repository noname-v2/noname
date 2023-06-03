import type { ClientAPI } from './client/ui';
import type { StageAPI } from './worker/stage';

declare global {
    /** Plain object. */
    type Dict<T=any> = {[key: string]: T};

    /** Function component with synced state. */
    type FC = (data: {cid?: string, state?: string, [key: string]: any}, api: ClientAPI) => JSX.Element;

    /** Stage main function. */
    type SF = (data: Dict, api: StageAPI) => any;
}