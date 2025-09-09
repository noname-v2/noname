import { toKebab } from "../utils";



/**
 * Renders a component to an HTML element.
 * @param cmp - Component object to render.
 */
function render(cmp: Component): HTMLElement {
    const tag = 'nn-' + toKebab(cmp.constructor.name);
    if (!customElements.get(tag)) {
        customElements.define(tag, class extends HTMLElement {});
    }
    return document.createElement(tag);
}

/**
 * Creates a root element for the given component and appends it to the document body.
 * @param cmp - Component class to create a root element for.
 */
export async function createRoot(cmp: Component) {
    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }
    // // add bindings for drag operations
    // document.body.addEventListener('touchmove', e => pointerMove(e.touches[0], true), {passive: true});
    // document.body.addEventListener('touchend', () => pointerEnd(true), {passive: true});
    // document.body.addEventListener('touchcancel', () => pointerCancel(true), {passive: true});

    // // avoid unexpected mouse event behavior on some Android devices
    // if (!android) {
    //     document.body.addEventListener('mousemove', e => pointerMove(e, false), {passive: true});
    //     document.body.addEventListener('mouseup', () => pointerEnd(false), {passive: true});
    //     document.body.addEventListener('mouseleave', () => pointerCancel(false), {passive: true});
    // }

    // // disable context menu
    // document.oncontextmenu = () => false;
    document.body.appendChild(render(cmp));
}
