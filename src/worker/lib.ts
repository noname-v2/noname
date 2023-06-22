/** Build-in stage functions. */
const baseLib = new Map<string, SF>();

/** Stage functions defined by extensions. */
const extensionLib = new Map<string, Map<string, SF>>();

/** Extension that defines current game mode. */
let currentMode: string | null = null;

/**
 * Register a component and its style.
 * @param {SFM} mod - Dict that contains function definition.
 * @param {string | undefined} ext - The extension that defines the function.
 */
export function register(mod: SFM, ext: string | null) {
    for (const key in mod) {
        if (ext && !extensionLib.has(ext)) {
            extensionLib.set(ext, new Map())
        }
        (ext ? extensionLib.get(ext)! : baseLib).set(key, mod[key]);
    }
}

/**
 * Remove all custom components and styles from extensions.
 * @param {string | undefined} mode - New game mode.
 */
export function init(mode?: string) {
    extensionLib.clear();
    currentMode = mode ?? null;
}

/** Access stage function. */
export const lib = (path: string, ext: string | null) : SF | null => {
    const abspath = abs(path, ext);

    if (abspath) {
        const [ext, func] = path.split('#');

        if (ext) {
            return extensionLib.get(ext)?.get(func) ?? null;
        }
        
        return baseLib.get(func) ?? null;
    }

    return null;
};

/** Change relative reference to absolute reference. */
export const abs = (path: string, ext: string | null) => {
    if (path.includes('#')) {
        return path;
    }

    // (priority: current extension > current mode > built-in)
    if (extensionLib.get(ext!)?.has(path)) {
        return ext + '#' + path;
    }

    if (extensionLib.get(currentMode!)?.has(path)) {
        return currentMode + '#' + path;
    }

    if (baseLib.has(path)) {
        return '#' + path;
    }

    return null;
};