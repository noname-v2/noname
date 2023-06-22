import { dur, animate, rendered } from './animate';
import { db } from './db';
import { bind, BindConfig } from './bind';
import { ui, UIType } from './components';
import { useState, useEffect, createRef } from 'react';

/** Component states. */
export const states = new Map<string, Dict>();

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
 * Update the state of a component with cid.
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

/** Get the state of a component with cid. */
export function getState(cid: string, key: string) {
    const state = states.get(cid);

    if (state) {
        return state[key] ?? null;
    }

    return null;
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
    // const db = new Database(data.__ext__); TODO: scoped database for the extension

    return {
        reply, sync, send, dur, db,
        ui: ((ext?: string) => ui(ext, data.__ext__, data.deviate)) as UIType,
        animate: (...args: Parameters<typeof animate>) => animate.apply(data, args),
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
                if (ref.current) {
                    if (cid) {
                        rendered.set(cid, ref.current);
                        bind(rendered.get(cid)!, null);
                    }
                    
                    const config = data.bind ?? data.__bind__;
                    if (config) {
                        bind(ref.current, config);
                    }
                }
            });

            return ref;
        },
        bind: (bind: BindConfig) => {
            data.__bind__ = bind;
        }
    };
}

export type StateAPI = ReturnType<typeof wrap>;

/**
 * Create the state of a component.
 * @param {Dict} props - Component property, will be registered if props.cid is string.
 * @param {string | null} ext - Name of the extension that defines the component.
 */
export function createState(props: FCProps = {}, ext: string | null): [Dict, StateAPI] {
    const cid = props.cid ?? null;
    const data: Dict = {};

    Object.assign(data, props);
    
    // merge props and state for components with cid
    const [state, setter] = useState(states.get(cid!) ?? { cid });
    Object.assign(data, state);

    data.__ext__ = ext;

    // update state and setter
    if (cid) {
        states.set(cid, state);
        setters.set(cid, setter);
    }

    return [data, wrap(data, state, setter)];
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
