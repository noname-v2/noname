import { ready } from './db';
import { useState } from "react";

/** Component states. */
const states = new Map<string, Dict>();

/** React state setter. */
const setters = new Map<string, React.Dispatch<Dict>>();

/** Components pending update. */
const pending = new Map<string, number>();

/**
 * Get the state of a worker-created component.
 * @param {Dict} props - Component property, will be registered if props.cid is string.
 */
export function getState(props: Dict = {}): Dict {
    if (typeof props.cid === 'string') {
        const [state, setState] = useState(states.get(props.cid) ?? props);
        states.set(props.cid, state);
        setters.set(props.cid, setState);
        return state;
    }
    return props;
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
    ready.then(db => {
        pending.set(cid, window.setTimeout(() => setState(cid, {}), delay * (db.get('duration') || 500)));
    });
}
