import type { UIType } from './client/ui';
import type { HubType } from './client/hub';
import type { StageAPI } from './worker/stage';

declare global {
    /** Plain object. */
    type Dict<T=any> = {[key: string]: T};

    /** Function component with synced state. */
    type FC = (data: Dict, UI: UIType, hub: HubType) => JSX.Element;

    /** Stage main function. */
    type SF = (data: Dict, api: StageAPI) => any;
}