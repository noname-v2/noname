declare class _Component {
    static name: Capitalize<string>;
}

export class Component implements _Component {
    #state: Map<string, any> = new Map();

    // component that created this component (from constructor or render())
    #creator;

    // managed by the worker (no setState() can be called except by the worker)
    #managed = false;

    constructor(creator: any, manager?: (setter: (key: string, value: any) => void) => void) {
        this.#creator = creator;

        if (manager) {
            manager((key, value) => {
                this.#setState(key, value);
            });
            this.#managed = true;
        }
    }

    static css = {};

    static mixins = [];

    state(key: string) {
        return this.#state.get(key);
    }

    #setState(key: string, value: any) {
        this.#state.set(key, value);
    }

    setState(key: string, value: any) {
        if (this.#managed) {
            throw new Error('setState() cannot be called by the worker');
        }

        this.#setState(key, value);
    }

    get creater() {
        return this.#creator;
    }

    get opacity() {
        return 1;
    }

    get scale() {
        return 1;
    }

    get scaleX() {
        return 1;
    }

    get scaleY() {
        return 1;
    }

    get scaleZ() {
        return 1;
    }

    get rotate() {
        return 0;
    }

    get rotateX() {
        return 0;
    }

    get rotateY() {
        return 0;
    }

    get rotateZ() {
        return 0;
    }

    get translateX() {
        return 0;
    }

    get translateY() {
        return 0;
    }

    get translateZ() {
        return 0;
    }

    get initialOpacity() {
        return this.opacity;
    }

    get initialScale() {
        return this.scale;
    }

    get initialScaleX() {
        return this.scaleX;
    }

    get initialScaleY() {
        return this.scaleY;
    }

    get initialScaleZ() {
        return this.scaleZ;
    }

    get initialRotate() {
        return this.rotate;
    }

    get initialRotateX() {
        return this.rotateX;
    }

    get initialRotateY() {
        return this.rotateY;
    }

    get initialRotateZ() {
        return this.rotateZ;
    }

    get initialTranslateX() {
        return this.translateX;
    }

    get initialTranslateY() {
        return this.translateY;
    }

    get initialTranslateZ() {
        return this.translateZ;
    }

    get mountAnimation() {
        return 1;
    }

    get updateAnimation() {
        return 1;
    }

    get unmountAnimation() {
        return 1;
    }

    get width() {
        return null;
    }

    get height() {
        return null;
    }

    get left() {
        return null;
    }

    get right() {
        return null;
    }

    get top() {
        return null;
    }

    get bottom() {
        return null;
    }

    get aspectRatio() {
        return null;
    }

    async init() {
        // called when component is initialized before mounting
    }

    async mount() {
        // called when component is mounted

    }

    async update() {
        // called when component is updated
    }

    async unmount() {
        // called when component is unmounted
    }
};
