/** Merge two objects. */
export function apply(to: Dict<any>, from: Dict<any>, exclude?: string[]): Dict<any> {
    for (const key in from) {
        if (exclude?.includes(key)) {
            continue;
        }
        else if (isDict(to[key]) && isDict(from[key])) {
            apply(to[key], from[key]!);
        }
        else if (from[key] !== undefined) {
            to[key] = from[key];
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
export function isCapatalized(str: string): str is Capitalize<string> {
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

/** Convert a camel or pascal string to a Kebab case.
 * @param str The string to convert.
 */
export function toKebab(str: string): Uncapitalize<string> {
    return unCapitalize(str).replace(/[A-Z]/g, c => `-${c.toLowerCase()}`) as Uncapitalize<string>;
}

/** Convert a snake string to a Pascal string.
 * @param str The string to convert.
 */
export function toPascal(str: string): Capitalize<string> {
    return capitalize(toCase(str));
}

/** Convert a snake string to a Camel or Pascal string.
 * @param str The string to convert.
 */
export function toCase(str: string) {
    return str.replace(/-./g, c => c.charAt(1).toUpperCase());
}

/** Check if an object is a plain object.
 * @param obj The object to check.
 */
export function isDict(obj: any): obj is Dict {
    return !!obj && typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype;
}
