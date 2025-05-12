"use strict";
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
    }
    promise(message, abortSignal) {
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
        (0, utils_js_1.addMessageEventListener)(this.target, onMessage);
        this.target.postMessage((0, messages_js_1.promiseMessage)(id, message));
        promise.finally(() => {
            this.target.removeEventListener("message", onMessage);
        });
        if (abortSignal) {
            const onAbort = () => {
                this.target.postMessage((0, messages_js_1.abortMessage)(id));
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
                this.target.postMessage((0, messages_js_1.observeMessage)(utils_js_1.UUID.create(), message));
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
