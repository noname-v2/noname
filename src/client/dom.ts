export function createFC(target: ComponentType): FC {
    return (..._: any[]) => {
        const cmp = new target({} as any);
        cmp.mount();
    };
}