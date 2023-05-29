import { pendUpdate } from "./state";

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

export function getHub(props: Dict) {
    return { reply, sync, send, refresh: (delay: number = 1) => refresh(props.cid, delay) }
}

export type HubType = ReturnType<typeof getHub>;
