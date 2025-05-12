"use strict";
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
var _Client_messageId;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const rxjs_1 = require("rxjs");
const messages_js_1 = require("./messages.js");
const utils_js_1 = require("./utils.js");
class Client {
    constructor(target) {
        Object.defineProperty(this, "target", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: target
        });
        _Client_messageId.set(this, 0);
    }
    promise(message, abortSignal) {
        var _a, _b;
        const id = (__classPrivateFieldSet(this, _Client_messageId, (_b = __classPrivateFieldGet(this, _Client_messageId, "f"), _a = _b++, _b), "f"), _a);
        const { resolve, reject, promise } = (0, utils_js_1.withResolvers)();
        const onMessage = (event) => {
            if ("id" in event.data && event.data.id !== id)
                return;
            if (event.data.type ===
                messages_js_1.MessageType.Reject) {
                reject(event.data.error);
            }
            else if (event.data.type ===
                messages_js_1.MessageType.Resolve) {
                resolve(event.data.data);
            }
            else {
                reject(new Error("Invalid message type"));
            }
        };
        (0, utils_js_1.addMessageEventListener)(this.target, onMessage);
        this.target.postMessage((0, messages_js_1.promiseMessage)(id, message));
        promise.finally(() => {
            this.target.removeEventListener("message", onMessage);
        });
        if (abortSignal) {
            const onAbort = () => {
                reject(new Error(abortSignal.reason));
            };
            abortSignal.addEventListener("abort", onAbort, { once: true });
            promise.finally(() => {
                abortSignal.removeEventListener("abort", onAbort);
            });
        }
        return promise;
    }
    observable(message) {
        return new rxjs_1.Observable((subscriber) => {
            var _a, _b;
            const onMessage = (event) => {
                if (event.data.type === messages_js_1.MessageType.Emit) {
                    subscriber.next(event.data.data);
                }
                else if (event.data.type === messages_js_1.MessageType.Complete) {
                    subscriber.complete();
                }
                else if (event.data.type === messages_js_1.MessageType.Error) {
                    subscriber.error(event.data.error);
                }
            };
            (0, utils_js_1.addMessageEventListener)(this.target, onMessage);
            if (message) {
                this.target.postMessage((0, messages_js_1.observeMessage)((__classPrivateFieldSet(this, _Client_messageId, (_b = __classPrivateFieldGet(this, _Client_messageId, "f"), _a = _b++, _b), "f"), _a), message));
            }
            return () => {
                this.target.removeEventListener("message", onMessage);
            };
        });
    }
    close() {
    }
}
exports.Client = Client;
_Client_messageId = new WeakMap();
