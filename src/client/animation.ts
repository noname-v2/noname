interface Config {
    translate: number | [number, number] | string;
    rotate: number | string;
    scale: number | string;
    opacity: number | string;
}

const durations = {
    normal: 3,
    fast: 0.2,
    faster: 0.1,
    slow: 0.5, 
    slower: 0.7
};

export type Duration = keyof typeof durations;

export type AnimationConfig = Duration | { duration?: Duration } & { [key: string]: Partial<Config>}


export function getCurrent(target?: HTMLElement): Config {
    const config = { translate: '', rotate: '', scale: '', opacity: '' };

    if (target) {
        const style = getComputedStyle(target);
        if (style.translate !== 'none') {
            config.translate = style.translate;
        }
        if (style.rotate !== 'none') {
            config.rotate = style.rotate;
        }
        if (style.scale !== 'none') {
            config.scale = style.scale;
        }
        if (style.opacity !== '1') {
            config.opacity = style.opacity;
        }
    }

    return config;
}

function parseConfig(config: Config) {
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

export const animations: {[key: string]: (this: any, target: HTMLElement, from: Config, config?: AnimationConfig) => void} = {
    fade(this: {fade: 'in' | 'out', cid?: string}, target, from, config) {
        const fade = this.fade;

        const base = {
            in: { opacity: 1, rotate: 0, scale: 1, translate: 0 },
            out: { opacity: 0, rotate: 0, scale: 1, translate: 0 }
        }
        const $fade = fade === 'in' ? 'out' : 'in';
        const to: Config = base[fade];
        const dur = typeof config === 'string' ? config : (config?.duration ?? 'normal');

        if (typeof config === 'object') {
            for (const key in config[fade]) {
                (to as any)[key] = (config as any)[fade][key];
            }

            for (const key in config[$fade]) {
                if ((from as any)[key] === '') {
                    (from as any)[key] = (config as any)[$fade]![key];
                }
            }
        }

        if (from.opacity === '' && fade === 'in') {
            from.opacity = 0;
        }

        target?.getAnimations().map(anim => anim.cancel())
        target?.animate([parseConfig(from), parseConfig(to)], { duration: durations[dur] * 1000, fill: 'forwards' });
    }
}
