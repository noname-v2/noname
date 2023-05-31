import { pendUpdate, getState, setState } from "./state";
import type { UIType } from "./ui";

/** Web worker and current state of worker. */
export const hubState = <{ worker: Worker, asked: number }>{};

/**
 * Send result to worker-side hub.ask().
 */
const reply = (result: any) => {
    hubState.worker.postMessage([hubState.asked, result]);
}

/**
 * Send update to worker-side hub.monitor().
 */
const sync = () => {

}


/**
 * Send global messanges (e.g. switch to auto, chat, etc.)
 */
const send = () => {

}

/**
 * Update component.
 */
const refresh = (cid: string, delay: number) => {
    if (typeof cid === 'string') {
        pendUpdate(cid, delay);
    }
    else {
        throw('Cannot call update() for component without a cid.')
    }
}

function getHub(cid: string) {
    return {
        reply, sync, send,
        refresh: (delay: number = 1) => refresh(cid, delay),
        update: (diff: Dict) => setState(cid, diff)
    };
}

export type HubType = ReturnType<typeof getHub>;

export function UIArgs(props: Dict, UI: UIType): [Dict, UIType, HubType] {
    const [cid, state] = getState(props);

    return [state, UI, getHub(cid)];
}

