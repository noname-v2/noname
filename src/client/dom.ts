import { toHyphen } from "../utils";

export function createFC(target: ComponentType): FC {
    return (..._: any[]) => {
        const cmp = new target({} as any);
        cmp.mount();
    };
}

function render(target: Component): HTMLElement {
    const tag = toHyphen(target.constructor.name);
    if (!customElements.get(tag)) {
        customElements.define(tag, class extends HTMLElement {});
    }
    return document.createElement(tag);
}

export function createRoot(target: Component): HTMLElement {
    const root = render(target);
    document.body.appendChild(root);
    return root;
}

/** Resolved when document is ready. */
export const ready = new Promise<void>(async resolve => {
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

    resolve();
});
