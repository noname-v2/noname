import { db } from './db';
import { animations, getCurrent, AnimationConfig } from './animation';
import react from "react";
import type { ClientAPI } from "./ui";

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

/** Rendered components with unique IDs. */
const rendered = new Map<string, HTMLElement>();

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

    // update component state
    states.set(cid, newState);
    if (setters.has(cid)) {
        setters.get(cid)!(newState);
    }
}

/** Wrap functions for FC. */
const wrap = (data: Dict) => {
    const cid = data.cid;
    return {
        reply, sync, send, react,
        refresh: (delay: number = 1) => (cid ? refresh(cid, delay) : null),
        update: (diff: Dict) => (cid ? setState(cid, diff) : null),
        animate: (anims: {[key: string]: AnimationConfig}) => {
            const ref = react.createRef<HTMLElement>();
            const from = getCurrent(rendered.get(cid));

            /** Update after component is rendered. */
            react.useEffect(() => {
                if (cid && ref.current) {
                    rendered.set(cid, ref.current);
                }
            });

            /** Trigger animation when corresponding property changes. */
            for (const key in anims) {
                react.useEffect(() => {
                    animations[key].apply(data, [ref.current!, from, anims[key]]);
                }, [data[key]])
            }

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
    const cid = props.cid;
    const data: Dict = {}
    
    for (const key in props) {
        data[key] = props[key];
    }
    
    if (cid) {
        // merge props and state for components with cid
        const [state, setter] = react.useState(states.get(cid) ?? { cid });

        for (const key in state) {
            data[key] = state[key];
        }

        // update state and setter
        states.set(cid, state);
        setters.set(cid, setter);
    }

    // create a copy of UI object that wraps cid
    const ui: Partial<ClientAPI> = wrap(data);

    for (const key in UI) {
        (ui as any)[key] = UI[key];
    }

    for (const key in animations) {
        (ui as any)[key] = (...args: any[]) => (animations as any)[key].apply(data, args);
    }

    return [data, ui as ClientAPI];
}

/**
 * Update component after a certain factor of default delay time.
 */
export function pendUpdate(cid: string, delay: number) {
    window.clearTimeout(pending.get(cid));
    pending.set(cid, window.setTimeout(() => setState(cid, {}), delay * (db?.get('duration') || 500)));
}

/** Create worker object. */
export function createWorker() {
    worker ??= new Worker(new URL('../worker/local.ts', import.meta.url), {type: 'module'});
    return worker;
}
