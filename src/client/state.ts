import { dur, animate, rendered } from './animate';
import { db } from './db';
import { useState, useEffect, createRef } from 'react';
import type { ClientAPI } from './ui';

/** Component states. */
const states = new Map<string, Dict>();

/** React state setter. */
const setters = new Map<string, React.Dispatch<Dict>>();

/** Components pending update. */
const pending = new Map<string, number>();

/** Web worker object. */
let worker: Worker;

/** Counter of worker-side  */
let asked: number;

/**
 * Send result to worker-side hub.ask().
 */
const reply = (result: any) => {
    worker.postMessage([asked, result]);
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
 * Update the state of a worker-created component.
 * @param {string} cid - Unique ID of the component.
 * @param {Dict} diff - Changed to the component state.
 */
export function setState(cid: string, diff: Dict) {
    if (cid === '^') {
        asked = diff as any;
        return;
    }

    window.clearTimeout(pending.get(cid));

    const oldState = states.get(cid) ?? {};
    const newState = getNewState(oldState, diff);

    // update component state
    states.set(cid, newState);

    if (setters.has(cid)) {
        setters.get(cid)!(newState);
    }
}

/** Create a new state object with updated values. */
const getNewState = (oldState: Dict, diff: Dict) => {
    const newState: Dict = {};

    // copy unchanged state
    for (const key in oldState) {
        if (key[0] !== '$' && !(key in diff)) {
            newState[key] = oldState[key];
        }
    }

    // update state and save old state
    for (const key in diff) {
        newState['$' + key] = oldState[key] ?? null;
        newState[key] = diff[key];
    }

    return newState;
};

/** Wrap functions for FC. */
const wrap = (data: Dict, state: Dict, setter: React.Dispatch<Dict>) => {
    const cid = data.cid;

    return {
        reply, sync, send, dur, db,
        animate: ((...args) => animate.apply(data, args)) as OmitThisParameter<typeof animate>,
        refresh: (delay: number = 1) => {
            if (cid) {
                pendUpdate(cid, delay);
            }
            else {
                window.setTimeout(() => setter(getNewState(state, {})), delay * dur('slower'))
            }
        },
        update: (diff: Dict) => {
            if (cid) {
                setState(cid, diff)
            }
            else {
                setter(getNewState(state, diff));
            }
        },
        ref: () => {
            const ref = createRef<HTMLElement>();
            data.__ref__ = ref;

            useEffect(() => {
                if (cid && ref.current) {
                    rendered.set(cid, ref.current);
                }
            });

            return ref;
        }
    }
}

export type StateAPI = ReturnType<typeof wrap>;

/**
 * Get the state of a worker-created component.
 * @param {Dict} props - Component property, will be registered if props.cid is string.
 */
export function getState(props: Dict = {}, UI: any): [Dict, ClientAPI] {
    const cid = props.cid ?? null;
    const data: Dict = {};
    
    for (const key in props) {
        data[key] = props[key];
    }
    
    // merge props and state for components with cid
    const [state, setter] = useState(states.get(cid) ?? { cid });

    for (const key in state) {
        data[key] = state[key];
    }

    // update state and setter
    if (cid) {
        states.set(cid, state);
        setters.set(cid, setter);
    }

    // create a copy of UI object that wraps cid
    const ui: Partial<ClientAPI> = wrap(data, state, setter);

    for (const key in UI) {
        (ui as any)[key] = UI[key];
    }

    return [data, ui as ClientAPI];
}

/**
 * Update component after a certain factor of default delay time.
 */
export function pendUpdate(cid: string, delay: number) {
    window.clearTimeout(pending.get(cid));
    pending.set(cid, window.setTimeout(() => setState(cid, {}), delay * dur('slower')));
}

/** Create worker object. */
export function createWorker() {
    if (!worker) {
        worker = new Worker(new URL('../worker/local.ts', import.meta.url), {type: 'module'});
        worker.onmessage = ({data}) => {
            for (const cid in data) {
                setState(cid, data[cid]);
            }
        }    
    }
}
