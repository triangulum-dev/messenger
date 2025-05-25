var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _AppBuilder_promiseHandlers, _AppBuilder_observableHandlers, _AppBuilder_built;
import * as dntShim from "./_dnt.shims.js";
import { AppContext } from "./app-context.js";
import { AppReference } from "./app-reference.js";
import { CONTROLLER_METHOD_TYPES, CONTROLLER_NAME } from "./controller.js";
export class AppBuilder {
    constructor(target = dntShim.dntGlobalThis) {
        Object.defineProperty(this, "target", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: target
        });
        _AppBuilder_promiseHandlers.set(this, {});
        _AppBuilder_observableHandlers.set(this, {});
        _AppBuilder_built.set(this, false);
    }
    mapPromise(name, handler) {
        __classPrivateFieldGet(this, _AppBuilder_promiseHandlers, "f")[name] = handler;
        return this;
    }
    mapObservable(name, handler) {
        __classPrivateFieldGet(this, _AppBuilder_observableHandlers, "f")[name] = handler;
        return this;
    }
    addController(controllerInstance) {
        const constructor = controllerInstance.constructor;
        const name = Reflect.getMetadata(CONTROLLER_NAME, constructor);
        const methodTypes = Reflect.getMetadata(CONTROLLER_METHOD_TYPES, constructor);
        if (!methodTypes) {
            throw new Error(`AppBuilder: Controller class ${constructor.name} has no methods decorated with @promise or @observable.`);
        }
        for (const methodName in methodTypes) {
            const handler = controllerInstance[methodName];
            if (typeof handler !== "function") {
                console.warn(`AppBuilder: Expected method ${methodName} on ${constructor.name} to be a function, but got ${typeof handler}.`);
                continue;
            }
            const boundHandler = handler.bind(controllerInstance);
            const handlerName = name ? `${name}.${methodName}` : methodName;
            if (methodTypes[methodName] === "promise") {
                this.mapPromise(handlerName, boundHandler);
            }
            else if (methodTypes[methodName] === "observable") {
                this.mapObservable(handlerName, boundHandler);
            }
        }
        return this;
    }
    build() {
        if (__classPrivateFieldGet(this, _AppBuilder_built, "f"))
            throw new Error("AppBuilder: already built");
        __classPrivateFieldSet(this, _AppBuilder_built, true, "f");
        const appContext = new AppContext(this.target);
        return new AppReference(appContext, __classPrivateFieldGet(this, _AppBuilder_promiseHandlers, "f"), __classPrivateFieldGet(this, _AppBuilder_observableHandlers, "f"));
    }
}
_AppBuilder_promiseHandlers = new WeakMap(), _AppBuilder_observableHandlers = new WeakMap(), _AppBuilder_built = new WeakMap();
