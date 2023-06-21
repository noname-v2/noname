import type { createState } from './state';
import type { UIDict } from './ui';

/** Built-in components. */
const baseUI: UIMap = new Map();

/** Components defined by extensions. */
const extensionUI: Map<string, UIMap> = new Map();

/** Custom HTML tags defined. */
const customTags = new Set<string>();

/** Extension that defines current game mode. */
let currentMode: string | null = null;

/**
 * Register a component and its style.
 * @param {FCM} mod - Dict that contains component and style definition.
 * @param {string | undefined} ext - The extension that defines the component.
 */
export function register(mod: FCM, ext: string | null, cs: typeof createState) {
    for (const key in mod) {
        if (/[A-Z]/.test(key[0])) {
            let tag = ext ? 'nx-' : 'nn-';
            tag += key[0].toLowerCase();

            for (let i = 1; i < key.length; i++) {
                if (/[A-Z]/.test(key[i])) {
                    tag += '-' + key[i].toLowerCase();
                }
                else {
                    tag += key[i];
                }
            }

            if (!customTags.has(tag)) {
                customTags.add(tag);
                customElements.define(tag, class extends HTMLElement {});
            }
        }

        if (ext && !extensionUI.has(ext)) {
            extensionUI.set(ext, new Map())
        }

        (ext ? extensionUI.get(ext)! : baseUI).set(key, (props: Dict) => mod[key as CapString](...cs(props, ext)));
    }
}

/**
 * Remove all custom components and styles from extensions.
 * @param {string | undefined} mode - Current game mode.
 */
export function init(mode?: string) {
    extensionUI.clear();
    currentMode = mode ?? null;
}

/** Access components. */
export const ui = (ext?: string, deviate?: Partial<UIDict>) => {
    const components = {} as UIDict;

    if (ext) {
        // copy components from an extension
        const cmps = extensionUI.get(ext);
        if (cmps) {
            for (const [key, val] of cmps.entries()) {
                components[key as CapString] = val;
            }
        }
    }
    else {
        // copy built-in components
        for (const [key, val] of baseUI.entries()) {
            components[key as CapString] = val;
        }

        // copy components from current mode
        const cmps = extensionUI.get(currentMode!);
        if (cmps) {
            for (const [key, val] of cmps.entries()) {
                components[key as CapString] = val;
            }
        }
    }

    Object.assign(components, deviate)

    return components;
}