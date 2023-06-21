import { useEffect } from 'react';

/** Rendered components with unique IDs. */
export const rendered = new Map<string, HTMLElement>();

/** Preset duration for transition. */
const durations = {
    normal: 0.3,
    fast: 0.2,
    faster: 0.1,
    slow: 0.5, 
    slower: 0.7
};

type AnimationDuration = number | keyof typeof durations;

/** Convert duration type to milliseconds. */
export function dur(duration?: AnimationDuration): number {
    if (typeof duration === 'string') {
        duration = durations[duration];
    }

    duration ??= durations.normal;

    return duration * 1000;
}

/** CSS properties for animation. */
type AnimationFrame = Partial<{
    translate: number | [number, number] | string;
    rotate: number | string;
    scale: number | string;
    opacity: number | string;
}>;

/** Type for animation configuration of a component. */
type AnimationConfig = {
    [key: string]: AnimationFrame | AnimationFrame[];
};

/** Animate a component when its state value changes. */
export function animate(this: Dict, anims: Partial<AnimationConfig>, duration?: AnimationDuration) {
    const cid = this.cid;
    const from = getCurrent(cid);
    const state = this.animate;

    duration = dur(duration);

    // default properties when component is mounted / unmounted
    anims.in ??= {};
    if (Array.isArray(anims.in) && !anims.in.length) {
        anims.in.push({});
    }
    const animsIn = Array.isArray(anims.in) ? anims.in[anims.in.length-1] : anims.in;
    animsIn.opacity ??= 1;
    animsIn.rotate ??= 0;
    animsIn.scale ??= 1;
    animsIn.translate ??= 0;
    
    anims.out ??= {};
    if (Array.isArray(anims.out) && !anims.out.length) {
        anims.out.push({});
    }
    const animsOut = Array.isArray(anims.out) ? anims.out[anims.out.length-1] : anims.out;
    animsOut.opacity ??= 0;

    // trigger animation when state property changes
    useEffect(() => {
        const target = this.__ref__?.current as HTMLElement;
        const anim = anims[state];

        if (!target || !anim || (Array.isArray(anim) && !anim.length)) {
            return;
        }
        
        const frames = Array.isArray(anim) ? anim.slice(0) : [anim];
        frames.unshift(from ?? animsOut!);
        (duration as number) *= Math.sqrt(frames.length - 1);
        
        // fill default animation property
        frames.forEach(frame => {
            frame.opacity ??= animsIn.opacity;
            frame.rotate ??= animsIn.rotate;
            frame.scale ??= animsIn.scale;
            frame.translate ??= animsIn.translate;
        });

        target.getAnimations().map(anim => anim.cancel());
        target.animate(frames.map(frame => parseConfig(frame)), { duration, fill: 'forwards', easing: 'ease' });
    }, [state]);
}

/** Get the style of last rendered element. */
export function getCurrent(cid: string): AnimationFrame | null {
    const target = rendered.get(cid);

    if (target && document.contains(target)) {
        const { translate, rotate, scale, opacity } = getComputedStyle(target);
        return { translate, rotate, scale, opacity };
    }

    return null;
}

/** Convert numbers in CSS property to pixels. */
function parseConfig(config: AnimationFrame) {
    let translate = config.translate;
    let rotate = config.rotate;
    let scale = config.scale;
    let opacity = config.opacity;

    if (typeof translate === 'number') {
        translate = translate + 'px';
    }
    else if (Array.isArray(translate)) {
        translate = translate[0] + 'px ' + translate[1] + 'px';
    }

    if (typeof rotate === 'number') {
        rotate = rotate + 'deg';
    }

    return { translate, rotate, scale, opacity };
}
