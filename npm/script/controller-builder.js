"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _ControllerBuilder_proxyBuilder, _ControllerBuilder_promiseHandlers, _ControllerBuilder_observableHandlers, _ControllerBuilder_built;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllerBuilder = void 0;
const controller_js_1 = require("./controller.js");
const proxy_builder_js_1 = require("./proxy-builder.js");
class ControllerBuilder {
    constructor() {
        _ControllerBuilder_proxyBuilder.set(this, void 0);
        _ControllerBuilder_promiseHandlers.set(this, {});
        _ControllerBuilder_observableHandlers.set(this, {});
        _ControllerBuilder_built.set(this, false);
        __classPrivateFieldSet(this, _ControllerBuilder_proxyBuilder, new proxy_builder_js_1.ProxyBuilder(), "f");
    }
    addPromiseFunctionHandler(name, handler) {
        __classPrivateFieldGet(this, _ControllerBuilder_promiseHandlers, "f")[name] = handler;
        __classPrivateFieldGet(this, _ControllerBuilder_proxyBuilder, "f").addFunction({
            name,
            func: handler,
        });
        return this;
    }
    addObservableFunctionHandler(name, handler) {
        __classPrivateFieldGet(this, _ControllerBuilder_observableHandlers, "f")[name] = handler;
        __classPrivateFieldGet(this, _ControllerBuilder_proxyBuilder, "f").addFunction({
            name,
            func: handler,
        });
        return this;
    }
    build(id, source) {
        if (__classPrivateFieldGet(this, _ControllerBuilder_built, "f"))
            throw new Error("ControllerBuilder: already built");
        __classPrivateFieldSet(this, _ControllerBuilder_built, true, "f");
        const controller = new controller_js_1.Controller(id, source);
        controller.onPromise(async ({ function: fn, args }) => {
            if (typeof fn !== "string" || !(fn in __classPrivateFieldGet(this, _ControllerBuilder_promiseHandlers, "f"))) {
                throw new Error(`Unknown promise function: ${fn}`);
            }
            return await __classPrivateFieldGet(this, _ControllerBuilder_promiseHandlers, "f")[fn](...(args ?? []));
        });
        controller.onObservable(({ function: fn, args }) => {
            if (typeof fn !== "string" || !(fn in __classPrivateFieldGet(this, _ControllerBuilder_observableHandlers, "f"))) {
                throw new Error(`Unknown observable function: ${fn}`);
            }
            return __classPrivateFieldGet(this, _ControllerBuilder_observableHandlers, "f")[fn](...(args ?? []));
        });
        return __classPrivateFieldGet(this, _ControllerBuilder_proxyBuilder, "f").build();
    }
}
exports.ControllerBuilder = ControllerBuilder;
_ControllerBuilder_proxyBuilder = new WeakMap(), _ControllerBuilder_promiseHandlers = new WeakMap(), _ControllerBuilder_observableHandlers = new WeakMap(), _ControllerBuilder_built = new WeakMap();
