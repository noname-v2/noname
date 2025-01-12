/** Merge two objects. */
export function apply<T extends Dict = Dict>(to: T, from: Partial<T>, exclude?: (keyof T)[]): T {
    for (const key in from) {
        if (exclude?.includes(key)) {
            continue;
        }
        else if (to[key]?.constructor === Object && from[key]?.constructor === Object) {
            apply(to[key], from[key]!);
        }
        else if (from[key] !== null && from[key] !== undefined) {
            to[key] = from[key]!;
        }
    }
    return to;
}

/** Generate a unique string based on current Date.now().
 * Mapping: Date.now(): [0-9] -> [0-62] -> [A-Z] | [a-z] | [0-9]
 */
export function uid() {
    return new Date().getTime().toString().split('').map(n => {
        const c = Math.floor((parseInt(n) + Math.random()) * 6.2);
        return String.fromCharCode(c < 26 ? c + 65 : (c < 52 ? c + 71 : c - 4));
    }).join('');
}

/** Check if a string is capatalized.
 * @param str The string to check.
 */
export function isCapatalized(str: string) {
    return str.charAt(0) === str.charAt(0).toUpperCase();
}

/** Capitalize a string.
 * @param str The string to capitalize.
 */
export function capitalize(str: string): Capitalize<string> {
    return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<string>;
}

/** Uncapitalize a string.
 * @param str The string to uncapitalize.
 */
export function unCapitalize(str: string): Uncapitalize<string> {
    return (str.charAt(0).toLowerCase() + str.slice(1)) as Uncapitalize<string>;
}

/** Convert a pascal string to a case string.
 * @param str The string to convert.
 */
export function toSnake(str: string): Uncapitalize<string> {
    return str.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`) as Uncapitalize<string>;
}

/** Convert a snake string to a case string.
 * @param str The string to convert.
 */
export function toCase(str: string) {
    return str.replace(/_./g, c => c.charAt(1).toUpperCase());
}
