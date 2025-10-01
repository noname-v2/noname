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

/** Deep copy a Dict or return original object. */
export function copy(from: any, exclude?: string[]): Dict<any> {
    if (!isDict(from)) {
        return from;
    }
    const to: Dict<any> = {};
    for (const key in from) {
        if (exclude?.includes(key)) {
            continue;
        }
        else if (isDict(from[key])) {
            to[key] = copy(from[key]);
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

/** Convert camelCase or PascalCase or snake_case to kebab-case.
 * @param str The string to convert.
 */
export function toKebab(str: string): Uncapitalize<string> {
    return unCapitalize(str).replace(/[A-Z]/g, c => `-${c.toLowerCase()}`).replace(/[-_]+/g, '-') as Uncapitalize<string>;
}

/** Convert camelCase or PascalCase or kebab-case to snake_case.
 * @param str The string to convert.
 */
export function toSnake(str: string): Uncapitalize<string> {
    return unCapitalize(str).replace(/[A-Z]/g, c => `_${c.toLowerCase()}`).replace(/[_-]+/g, '_') as Uncapitalize<string>;
}

/** Convert snake_case or kebab-case to PascalCase.
 * @param str The string to convert.
 */
export function toPascal(str: string): Capitalize<string> {
    return capitalize(str.replace(/[-_](.)/g, (_, c) => c.toUpperCase()));
}

/** Check if an object is a plain object.
 * @param obj The object to check.
 */
export function isDict(obj: any): obj is Dict {
    return !!obj && typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype;
}
