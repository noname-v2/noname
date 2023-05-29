import type { UIType } from './client/ui';
import type { ClientAPI } from './client/api';
import type { StageAPI } from './worker/stage';

declare global {
    /** Plain object. */
    type Dict<T=any> = {[key: string]: T};

    /** Function component with synced state. */
    type FC = (data: Dict, UI: UIType, api: ClientAPI) => JSX.Element;

    /** Stage main function. */
    type SF = (data: Dict, api: StageAPI) => any;
}