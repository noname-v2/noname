import { isCapatalized, toSnake } from "../utils";
import { Component } from "./component";

const _ui = {} as UI;

function _define(name: Capitalize<string>, component: typeof Component) {
    if (!isCapatalized(name)) {
        throw new Error('Component name must be capatalized');
    }
    _ui[name] = component;
    _ui[toSnake(name)] = (...args: (Component | string | Dict)[]) => {console.log(args);return new Component({} as any)};
}

export function defineComponent(component: typeof Component) {
    _define(component.name as Capitalize<string>, component);
}

export function extendComponent(name: Capitalize<string>, extender: (component: typeof Component) => typeof Component) {
    _define(name, extender(_ui[name]));
}

export function extendRootComponent() {

}

export const ui = new Proxy(_ui, {
    get: function(target, prop: Capitalize<string> | Uncapitalize<string>) {
        return target[prop];
    }
}) as UI;