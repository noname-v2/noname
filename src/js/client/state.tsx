import { useState } from "react";

const states = new Map<string, Dict>();
const setters = new Map<string, React.Dispatch<Dict>>();

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
