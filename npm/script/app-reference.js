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
var _AppReference_appContext, _AppReference_promiseHandlers, _AppReference_observableHandlers, _AppReference_started;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppReference = void 0;
class AppReference {
    constructor(appContext, promiseHandlers, observableHandlers) {
        _AppReference_appContext.set(this, void 0);
        _AppReference_promiseHandlers.set(this, void 0);
        _AppReference_observableHandlers.set(this, void 0);
        _AppReference_started.set(this, false);
        __classPrivateFieldSet(this, _AppReference_appContext, appContext, "f");
        __classPrivateFieldSet(this, _AppReference_promiseHandlers, promiseHandlers, "f");
        __classPrivateFieldSet(this, _AppReference_observableHandlers, observableHandlers, "f");
    }
    run() {
        if (!__classPrivateFieldGet(this, _AppReference_started, "f")) {
            __classPrivateFieldGet(this, _AppReference_appContext, "f").onPromise(async (data, _abortSignal) => {
                const { function: fn, args } = data;
                if (typeof fn !== "string" || !(fn in __classPrivateFieldGet(this, _AppReference_promiseHandlers, "f"))) {
                    throw new Error(`Unknown promise function: ${fn}`);
                }
                return await __classPrivateFieldGet(this, _AppReference_promiseHandlers, "f")[fn](...(args ?? []));
            });
            __classPrivateFieldGet(this, _AppReference_appContext, "f").onObservable((data) => {
                const { function: fn, args } = data;
                if (typeof fn !== "string" || !(fn in __classPrivateFieldGet(this, _AppReference_observableHandlers, "f"))) {
                    throw new Error(`Unknown observable function: ${fn}`);
                }
                return __classPrivateFieldGet(this, _AppReference_observableHandlers, "f")[fn](...(args ?? []));
            });
            __classPrivateFieldSet(this, _AppReference_started, true, "f");
            __classPrivateFieldGet(this, _AppReference_appContext, "f").start();
        }
    }
}
exports.AppReference = AppReference;
_AppReference_appContext = new WeakMap(), _AppReference_promiseHandlers = new WeakMap(), _AppReference_observableHandlers = new WeakMap(), _AppReference_started = new WeakMap();
