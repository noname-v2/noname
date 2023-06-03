import { createRef, useEffect } from 'react';

/** Rendered components with unique IDs. */
const rendered = new Map<string, HTMLElement>();

/** Preset duration for transition. */
export const durations = {
    normal: 0.3,
    fast: 0.2,
    faster: 0.1,
    slow: 0.5, 
    slower: 0.7
};

export type AnimationDuration = number | keyof typeof durations;

/** CSS properties for animation. */
export type AnimationFrame = Partial<{
    translate: number | [number, number] | string;
    rotate: number | string;
    scale: number | string;
    opacity: number | string;
}>;

/** Type for animation configuration of a component. */
type AnimationConfig = {
    in: AnimationFrame;
    out: AnimationFrame;
    [key: string]: AnimationFrame | AnimationFrame[];
};

/** Animate a component when its state value changes. */
export function animate(this: Dict, anims: Partial<AnimationConfig>, duration: AnimationDuration = 'normal') {
    const cid = this.cid;
    const ref = createRef<HTMLElement>();
    const from = getCurrent(cid);
    const state = this.state ?? 'in';

    if (typeof duration === 'string') {
        duration = durations[duration];
    }
    duration ??= durations.normal;
    duration *= 1000;

    // default properties when component is mounted / unmounted
    anims.in ??= {};
    anims.in.opacity ??= 1;
    anims.in.rotate ??= 0;
    anims.in.scale ??= 1;
    anims.in.translate ??= 0;
    
    anims.out ??= {};
    anims.out.opacity ??= 0;

    // update after component is rendered
    useEffect(() => {
        if (cid && ref.current) {
            rendered.set(cid, ref.current);
        }
    });

    // trigger animation when state property changes
    useEffect(() => {
        const target = ref.current;
        const anim = anims[state];

        if (!target || !anim || (Array.isArray(anim) && !anim.length)) {
            return;
        }
        
        const frames = Array.isArray(anim) ? anim.slice(0) : [anim];
        frames.unshift(from ?? anims.out!);
        (duration as number) *= Math.sqrt(frames.length - 1);
        
        // fill default animation property
        frames.forEach(frame => {
            frame.opacity ??= anims.in!.opacity;
            frame.rotate ??= anims.in!.rotate;
            frame.scale ??= anims.in!.scale;
            frame.translate ??= anims.in!.translate;
        });

        target.getAnimations().map(anim => anim.cancel());
        target.animate(frames.map(frame => parseConfig(frame)), { duration, fill: 'forwards', easing: 'ease' });
    }, [state]);

    return ref;
}


export function getCurrent(cid: string): AnimationFrame | null {
    const target = rendered.get(cid);

    if (target && document.contains(target)) {
        const { translate, rotate, scale, opacity } = getComputedStyle(target);
        return { translate, rotate, scale, opacity };
    }

    return null;
}

/** Convert number in CSS property to pixels. */
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
