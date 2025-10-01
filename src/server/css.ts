import { isDict, toKebab } from "../utils";
import { elementProps, dimensionProps } from "../constants";
import type Server from "./server";

// Convert a CSSDict to a CSS string
function toCSS(cssDict: CSSDict): string {
    let cssString = '';
    for (const key in cssDict) {
        const value = (cssDict as Dict<CSSDict>)[key];
        if (typeof value === 'string' || typeof value === 'number') {
            const prop = key.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
            cssString += `${prop}:${value};`;
        }
        else if (isDict(value)) {
            cssString += `${key}{${toCSS(value)}}`;
        }
    }
    return cssString;
}

// Default CSS styles
const defaultCSS: CSSDict = {
    display: 'block',
    position: 'absolute',
    transformOrigin: 'top left',
    userSelect: 'none',
};

// Generate CSS styles from all components
export function getStyleString(components: Dict<ComponentDefinition>) {
    const css: Dict<CSSDict> = {}; // styles from static css property
    const mixin: Dict<Set<string>> = {}; // mixin group name from static mixin property
    const native: Dict<boolean> = {}; // whether to add 'nn-' prefix to final tag name
    const styles: Dict<CSSDict> = {}; // combined css and mixins

    // Gather styles from all components by tag name
    for (const tag in components) {
        const cls = components[tag];
        native[tag] = cls.native || false;
        css[tag] = cls.css ?? {};
        cls.mixin?.forEach(m => {
            if (!mixin[m]) {
                mixin[m] = new Set();
            }
            mixin[m].add(tag);
        });
    }

    // Convert from tag to HTML tag name
    const toTagName = (tag: string) => (native[tag] || tag.startsWith('nn-') ? '' : 'nn-') + toKebab(tag);

    // Combine css and mixins into final styles
    for (const tag in css) {
        let selector = toTagName(tag);
        mixin[tag]?.forEach(m => {
            selector += `,${toTagName(m)}`;
        });
        styles[selector] = css[tag];

        // Fill default styles from Component.css
        for (const m in defaultCSS) {
            if (!(m in styles[selector])) {
                (styles as any)[selector][m] = (defaultCSS as any)[m];
            }
        }
    }

    // Add static style properties from components
    // from here: add static width(), height(), etc.

    // Convert and send CSS styles to clients
    return toCSS(styles);
}


// Convert aspect ratio to CSS style string
function toRatioString(value: any): string {
    if (typeof value === 'number') {
        return value.toString();
    }
    if (Array.isArray(value) && value.length === 2) {
        return `${value[0]} / ${value[1]}`;
    }
    if (typeof value === 'string') {
        return value;
    }
    return '';
}

// Convert number, string or [number, number] to CSS style string
function toDimensionString(value: any): string {
    if (typeof value === 'number') {
        return value + 'px';
    }
    if (Array.isArray(value) && value.length === 2) {
        const dval = value[1] > 0 ? `+ ${value[1]}px` : `- ${-value[1]}px`;
        return `calc(${value[0]}% ${dval})`;
    }
    if (typeof value === 'string') {
        return value;
    }
    return '';
}

// Convert ComponentProps to ElementProps
export function propsToElement(props: ComponentProps, server: Server): ElementProps {
    const eprops = {} as any;
    
    // Copy properties that do not need conversion first
    for (const key in props) {
        if (key in elementProps) {
            eprops[key] = props[key];
        }
    }

    // Convert dimension properties to CSS styles
    for (const key in props) {
        const value = props[key];
        if (key in dimensionProps) {
            eprops.style ??= {};
            if (key in eprops.style) {
                server.warn("Overriding existing style." + key);
            }
            eprops.style[key] = key === 'aspectRatio' ? toRatioString(value) : toDimensionString(value);
        }
    }
    return eprops;
}