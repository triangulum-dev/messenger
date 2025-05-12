"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withResolvers = withResolvers;
exports.addMessageEventListener = addMessageEventListener;
exports.isMessagePort = isMessagePort;
exports.releaseMicrotask = releaseMicrotask;
function withResolvers() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { resolve, reject, promise };
}
function addMessageEventListener(target, listener) {
    target.addEventListener("message", listener);
    if (isMessagePort(target)) {
        target.start();
    }
}
function isMessagePort(target) {
    return (typeof target.start === "function");
}
function releaseMicrotask() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 0);
    });
}
