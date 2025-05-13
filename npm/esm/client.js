import { Observable } from "rxjs";
import { abortMessage, functionCallMessage, MessageType, observableFunctionCallMessage, promiseMessage, subscribeMessage, unsubscribeMessage, } from "./messages.js";
import { addMessageEventListener, UUID, withResolvers } from "./utils.js";
export function promise(target, message, abortSignal) {
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
    addMessageEventListener(target, onMessage);
    target.postMessage(promiseMessage(id, message));
    promise.finally(() => {
        target.removeEventListener("message", onMessage);
    });
    if (abortSignal) {
        const onAbort = () => {
            target.postMessage(abortMessage(id));
        };
        abortSignal.addEventListener("abort", onAbort, { once: true });
        promise.finally(() => {
            abortSignal.removeEventListener("abort", onAbort);
        });
    }
    return promise;
}
export function observable(target, message) {
    return new Observable((subscriber) => {
        const id = UUID.create();
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
        addMessageEventListener(target, onMessage);
        if (message) {
            target.postMessage(subscribeMessage(id, message));
        }
        return () => {
            target.removeEventListener("message", onMessage);
            target.postMessage(unsubscribeMessage(id));
        };
    });
}
export function client(target) {
    return new Proxy({}, {
        get(_obj, prop) {
            if (prop === "target")
                return target;
            // Find the original function name (strip trailing $ for observables)
            const isObservable = prop.endsWith("$");
            const fnName = isObservable ? prop.slice(0, -1) : prop;
            if (isObservable) {
                return (...args) => {
                    const message = observableFunctionCallMessage(fnName, args);
                    return observable(target, message);
                };
            }
            else {
                return (...args) => {
                    const message = functionCallMessage(fnName, args);
                    return promise(target, message);
                };
            }
        },
    });
}
