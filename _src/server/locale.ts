export default function translate(str: string) {
    if (str.startsWith('@')) {
        // leading @ indicates a translatable string
        return str.slice(1);
    }
    return str;
}