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
var _Controller_instances, _Controller_connections, _Controller_promiseCallback, _Controller_observableCallback, _Controller_activeRequests, _Controller_onMessage, _Controller_handlePromiseMessage, _Controller_handlePromise, _Controller_handleAbortMessage, _Controller_handleObservableMessage, _Controller_handleObservable;
import { MessageType, rejectMessage, resolveMessage } from "./messages.js";
import { addMessageEventListener } from "./utils.js";
export class Controller {
    constructor(target) {
        _Controller_instances.add(this);
        Object.defineProperty(this, "target", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: target
        });
        _Controller_connections.set(this, new Map());
        _Controller_promiseCallback.set(this, void 0);
        _Controller_observableCallback.set(this, void 0);
        // Use a single array as a deque for active requests
        _Controller_activeRequests.set(this, []);
        _Controller_onMessage.set(this, async (
        // deno-lint-ignore no-explicit-any
        event) => {
            const { data } = event;
            if (data.type === MessageType.Promise) {
                await __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_handlePromiseMessage).call(this, data);
            }
            else if (data.type === MessageType.Observable) {
                __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_handleObservableMessage).call(this, data);
            }
            else if (data.type === MessageType.Abort) {
                __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_handleAbortMessage).call(this, data);
            }
            else {
                console.error("Unknown message type:", data.type);
            }
        });
        // Listener setup moved to start() method
    }
    start() {
        const onMessage = (message) => __classPrivateFieldGet(this, _Controller_onMessage, "f").call(this, message);
        addMessageEventListener(this.target, onMessage);
    }
    onPromise(handler) {
        __classPrivateFieldSet(this, _Controller_promiseCallback, handler, "f");
        // Play any queued promise requests in order
        const pending = __classPrivateFieldGet(this, _Controller_activeRequests, "f").filter((r) => r.type === "promise");
        for (const req of pending) {
            __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_handlePromise).call(this, req);
        }
    }
    onObservable(handler) {
        __classPrivateFieldSet(this, _Controller_observableCallback, handler, "f");
        // Play any queued observable requests in order
        const pending = __classPrivateFieldGet(this, _Controller_activeRequests, "f").filter((r) => r.type === "observable");
        for (const req of pending) {
            __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_handleObservable).call(this, req);
        }
    }
    close() {
        // Reject/error all active requests in FIFO order before closing the port
        while (__classPrivateFieldGet(this, _Controller_activeRequests, "f").length > 0) {
            const req = __classPrivateFieldGet(this, _Controller_activeRequests, "f").shift();
            if (!req)
                break;
            if (req.type === "promise") {
                this.target.postMessage({
                    type: MessageType.Reject,
                    id: req.id,
                    error: new Error("Connection closed"),
                });
            }
            else if (req.type === "observable") {
                this.target.postMessage({
                    type: MessageType.Error,
                    id: req.id,
                    error: new Error("Connection closed"),
                });
            }
        }
        for (const [connection, onMessage] of __classPrivateFieldGet(this, _Controller_connections, "f")) {
            connection.port.removeEventListener("message", onMessage);
            connection.port.close();
        }
    }
}
_Controller_connections = new WeakMap(), _Controller_promiseCallback = new WeakMap(), _Controller_observableCallback = new WeakMap(), _Controller_activeRequests = new WeakMap(), _Controller_onMessage = new WeakMap(), _Controller_instances = new WeakSet(), _Controller_handlePromiseMessage = async function _Controller_handlePromiseMessage(data) {
    const abortController = new AbortController();
    const req = { id: data.id, type: "promise", data, abortController };
    __classPrivateFieldGet(this, _Controller_activeRequests, "f").push(req);
    await __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_handlePromise).call(this, req);
}, _Controller_handlePromise = async function _Controller_handlePromise(req) {
    if (!__classPrivateFieldGet(this, _Controller_promiseCallback, "f"))
        return;
    try {
        const result = await __classPrivateFieldGet(this, _Controller_promiseCallback, "f").call(this, req.data.data, req.abortController.signal);
        this.target.postMessage(resolveMessage(req.id, result));
    }
    catch (error) {
        try {
            this.target.postMessage(rejectMessage(req.id, error));
        }
        catch (e) {
            console.error("Error sending reject message:", e);
        }
    }
    finally {
        // Remove the first matching promise from the deque (FIFO)
        const idx = __classPrivateFieldGet(this, _Controller_activeRequests, "f").findIndex((r) => r.id === req.id &&
            r.type === "promise");
        if (idx !== -1)
            __classPrivateFieldGet(this, _Controller_activeRequests, "f").splice(idx, 1);
    }
}, _Controller_handleAbortMessage = function _Controller_handleAbortMessage(data) {
    const req = __classPrivateFieldGet(this, _Controller_activeRequests, "f").find((r) => r.id === data.id && r.type === "promise");
    if (req && req.abortController) {
        req.abortController.abort();
    }
}, _Controller_handleObservableMessage = function _Controller_handleObservableMessage(data) {
    const req = { id: data.id, type: "observable", data };
    __classPrivateFieldGet(this, _Controller_activeRequests, "f").push(req);
    __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_handleObservable).call(this, req);
}, _Controller_handleObservable = function _Controller_handleObservable(req) {
    if (!__classPrivateFieldGet(this, _Controller_observableCallback, "f"))
        return;
    let completed = false;
    const { id, data } = req;
    const removeFromActiveRequests = () => {
        const idx = __classPrivateFieldGet(this, _Controller_activeRequests, "f").findIndex((r) => r.id === id && r.type === "observable");
        if (idx !== -1)
            __classPrivateFieldGet(this, _Controller_activeRequests, "f").splice(idx, 1);
    };
    const observer = {
        next: (value) => {
            if (!completed) {
                this.target.postMessage({
                    type: MessageType.Emit,
                    id,
                    data: value,
                });
            }
        },
        error: (err) => {
            if (!completed) {
                completed = true;
                this.target.postMessage({
                    type: MessageType.Error,
                    id,
                    error: err,
                });
                removeFromActiveRequests();
            }
        },
        complete: () => {
            if (!completed) {
                completed = true;
                this.target.postMessage({ type: MessageType.Complete, id });
                removeFromActiveRequests();
            }
        },
    };
    try {
        const observable = __classPrivateFieldGet(this, _Controller_observableCallback, "f").call(this, data.data);
        if (observable && typeof observable.subscribe === "function") {
            observable.subscribe(observer);
        }
        else {
            throw new Error("Handler did not return an observable");
        }
    }
    catch (err) {
        observer.error(err);
    }
};
