import { db } from './db';
import { useState } from "react";

/** Component states. */
const states = new Map<string, Dict>();

/** React state setter. */
const setters = new Map<string, React.Dispatch<Dict>>();

/** Components pending update. */
const pending = new Map<string, number>();

/** Counter of components with auto cid. */
let c = 0;

/**
 * Get the state of a worker-created component.
 * @param {Dict} props - Component property, will be registered if props.cid is string.
 */
export function getState(props: Dict = {}) {
    const cid = props.cid || ('c:' + c++);
    let s: Dict;

    if (states.has(cid)) {
        s = states.get(cid)!;
        s.children = props.children;
    }
    else {
        s = {};
        for (const key in props) {
            s[key] = props[key];
        }
    }
    
    const [state, setState] = useState(s);
    states.set(cid, state);
    setters.set(cid, setState);

    return [cid, state];
}

/**
 * Update the state of a worker-created component.
 * @param {string} cid - Unique ID of the component.
 * @param {Dict} diff - Changed to the component state.
 */
export function setState(cid: string, diff: Dict) {
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

/**
 * Update component after a certain factor of default delay time.
 */
export function pendUpdate(cid: string, delay: number) {
    window.clearTimeout(pending.get(cid));
    pending.set(cid, window.setTimeout(() => setState(cid, {}), delay * (db?.get('duration') || 500)));
}
