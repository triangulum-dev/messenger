import { Observable } from "rxjs";
import { abortMessage, MessageType, observeMessage, promiseMessage, } from "./messages.js";
import { addMessageEventListener, UUID, withResolvers } from "./utils.js";
export class Client {
    constructor(target) {
        Object.defineProperty(this, "target", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: target
        });
    }
    promise(message, abortSignal) {
        const id = UUID.create();
        const { resolve, reject, promise } = withResolvers();
        const onMessage = (event) => {
            if ("id" in event.data && event.data.id !== id)
                return;
            if (event.data.type ===
                MessageType.Reject) {
                reject(event.data.error);
            }
            else if (event.data.type ===
                MessageType.Resolve) {
                resolve(event.data.data);
            }
            else {
                reject(new Error("Invalid message type"));
            }
        };
        addMessageEventListener(this.target, onMessage);
        this.target.postMessage(promiseMessage(id, message));
        promise.finally(() => {
            this.target.removeEventListener("message", onMessage);
        });
        if (abortSignal) {
            const onAbort = () => {
                this.target.postMessage(abortMessage(id));
            };
            abortSignal.addEventListener("abort", onAbort, { once: true });
            promise.finally(() => {
                abortSignal.removeEventListener("abort", onAbort);
            });
        }
        return promise;
    }
    observable(message) {
        return new Observable((subscriber) => {
            const onMessage = (event) => {
                if (event.data.type === MessageType.Emit) {
                    subscriber.next(event.data.data);
                }
                else if (event.data.type === MessageType.Complete) {
                    subscriber.complete();
                }
                else if (event.data.type === MessageType.Error) {
                    subscriber.error(event.data.error);
                }
            };
            addMessageEventListener(this.target, onMessage);
            if (message) {
                this.target.postMessage(observeMessage(UUID.create(), message));
            }
            return () => {
                this.target.removeEventListener("message", onMessage);
            };
        });
    }
    close() {
    }
}
