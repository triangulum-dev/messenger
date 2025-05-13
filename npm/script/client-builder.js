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
var _ClientBuilder_serviceObject, _ClientBuilder_built;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientBuilder = void 0;
exports.promiseFunction = promiseFunction;
exports.observableFunction = observableFunction;
const client_js_1 = require("./client.js");
const messages_js_1 = require("./messages.js");
function promiseFunction() {
    return { type: "promise" };
}
function observableFunction() {
    return { type: "observable" };
}
class ClientBuilder {
    constructor(target) {
        Object.defineProperty(this, "target", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: target
        });
        _ClientBuilder_serviceObject.set(this, void 0);
        _ClientBuilder_built.set(this, false);
        __classPrivateFieldSet(this, _ClientBuilder_serviceObject, {}, "f");
    }
    add(name, definition) {
        if (definition.type === "promise") {
            __classPrivateFieldGet(this, _ClientBuilder_serviceObject, "f")[name] = ((...args) => {
                const message = (0, messages_js_1.functionCallMessage)(name, args);
                return (0, client_js_1.promise)(this.target, message);
            });
        }
        else {
            __classPrivateFieldGet(this, _ClientBuilder_serviceObject, "f")[name] = ((...args) => {
                const message = (0, messages_js_1.observableFunctionCallMessage)(name, args);
                return (0, client_js_1.observable)(this.target, message);
            });
        }
        return this;
    }
    build() {
        if (__classPrivateFieldGet(this, _ClientBuilder_built, "f"))
            throw new Error("ClientBuilder: already built");
        __classPrivateFieldSet(this, _ClientBuilder_built, true, "f");
        return __classPrivateFieldGet(this, _ClientBuilder_serviceObject, "f");
    }
}
exports.ClientBuilder = ClientBuilder;
_ClientBuilder_serviceObject = new WeakMap(), _ClientBuilder_built = new WeakMap();
