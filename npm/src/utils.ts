import type { MessageTarget } from "./model.js";

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
  target: MessageTarget,
  listener: (event: MessageEvent) => void,
) {
  target.addEventListener("message", listener);
  if (isMessagePort(target)) {
    target.start();
  }
}

export function isMessagePort(
  target: MessageTarget,
): target is MessagePort {
  return (
    typeof (target as MessagePort).start === "function"
  );
}

export function releaseMicrotask() {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 0);
  });
}

export class UUID {
  static create() {
    return crypto.randomUUID();
  }
}
