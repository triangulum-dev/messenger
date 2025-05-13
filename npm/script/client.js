"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promise = promise;
exports.observable = observable;
exports.client = client;
const rxjs_1 = require("rxjs");
const messages_js_1 = require("./messages.js");
const utils_js_1 = require("./utils.js");
function promise(target, message, abortSignal) {
    const id = utils_js_1.UUID.create();
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
    (0, utils_js_1.addMessageEventListener)(target, onMessage);
    target.postMessage((0, messages_js_1.promiseMessage)(id, message));
    promise.finally(() => {
        target.removeEventListener("message", onMessage);
    });
    if (abortSignal) {
        const onAbort = () => {
            target.postMessage((0, messages_js_1.abortMessage)(id));
        };
        abortSignal.addEventListener("abort", onAbort, { once: true });
        promise.finally(() => {
            abortSignal.removeEventListener("abort", onAbort);
        });
    }
    return promise;
}
function observable(target, message) {
    return new rxjs_1.Observable((subscriber) => {
        const id = utils_js_1.UUID.create();
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
        (0, utils_js_1.addMessageEventListener)(target, onMessage);
        if (message) {
            target.postMessage((0, messages_js_1.subscribeMessage)(id, message));
        }
        return () => {
            target.removeEventListener("message", onMessage);
            target.postMessage((0, messages_js_1.unsubscribeMessage)(id));
        };
    });
}
function client(target) {
    return new Proxy({}, {
        get(_obj, prop) {
            if (prop === "target")
                return target;
            // Find the original function name (strip trailing $ for observables)
            const isObservable = prop.endsWith("$");
            const fnName = isObservable ? prop.slice(0, -1) : prop;
            if (isObservable) {
                return (...args) => {
                    const message = (0, messages_js_1.observableFunctionCallMessage)(fnName, args);
                    return observable(target, message);
                };
            }
            else {
                return (...args) => {
                    const message = (0, messages_js_1.functionCallMessage)(fnName, args);
                    return promise(target, message);
                };
            }
        },
    });
}
