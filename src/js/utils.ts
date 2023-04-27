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