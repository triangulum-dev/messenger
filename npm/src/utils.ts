import type { MessageSource } from "./model.js";

export function withResolvers<T>(): {
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
  promise: Promise<T>;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { resolve, reject, promise };
}

export function addMessageEventListener(
  source: MessageSource,
  listener: (event: MessageEvent) => void,
) {
  source.addEventListener("message", listener);
  if (isMessagePort(source)) {
    source.start();
  }
}

export function isMessagePort(
  source: MessageSource,
): source is MessagePort {
  return (
    typeof (source as MessagePort).start === "function"
  );
}

export function releaseMicrotask() {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 0);
  });
}
