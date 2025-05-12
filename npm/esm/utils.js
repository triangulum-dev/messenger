export function withResolvers() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { resolve, reject, promise };
}
export function addMessageEventListener(target, listener) {
    target.addEventListener("message", listener);
    if (isMessagePort(target)) {
        target.start();
    }
}
export function isMessagePort(target) {
    return (typeof target.start === "function");
}
export function releaseMicrotask() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 0);
    });
}
