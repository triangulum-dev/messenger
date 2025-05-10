export function withResolvers() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { resolve, reject, promise };
}
export function addMessageEventListener(source, listener) {
    source.addEventListener("message", listener);
    if (isMessagePort(source)) {
        source.start();
    }
}
export function isMessagePort(source) {
    return (typeof source.start === "function");
}
export function releaseMicrotask() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 0);
    });
}
