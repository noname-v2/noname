import type { createState } from './state';

/** Type for a map that contains component definitions. */
type UIMap = Map<string, (props: Dict) => JSX.Element>;

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

    // TODO: add CSS
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
type UIDict = { [key: CapString ]: FC };
export type UIType = ((path: string) => FC) & ((path?: undefined) => UIDict);
export const ui = (path?: string, ext?: string, deviate?: Partial<UIDict>): FC | UIDict => {
    if (path) {
        if (path.includes('#')) {
            // get components from absolute reference
            const [ext, cmp] = path.split('#');

            if (ext) {
                return extensionUI.get(ext)?.get(cmp)!;
            }
            
            return baseUI.get(cmp)!;
        }

        // get a component from relative reference (priority: current extension > current mode > built-in)
        return extensionUI.get(ext!)?.get(path) ?? extensionUI.get(currentMode!)?.get(path) ?? baseUI.get(path)!;
    }
    else {
        const components = {} as UIDict;

        const copy = (map?: UIMap) => {
            if (map) {
                for (const [key, val] of map.entries()) {
                    components[key as CapString] = val;
                }
            }
        }

        // copy built-in components
        copy(baseUI);

        // copy components from current mode
        if (currentMode) {
            copy(extensionUI.get(currentMode));
        }

        // copy components from the extension that defines current component
        if (ext) {
            copy(extensionUI.get(ext));
        }

        Object.assign(components, deviate)
    
        return components;
    }
};