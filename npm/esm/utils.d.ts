import type { MessageSource } from "./model.js";
export declare function withResolvers<T>(): {
    resolve: (value: T) => void;
    reject: (reason?: unknown) => void;
    promise: Promise<T>;
};
export declare function addMessageEventListener(source: MessageSource, listener: (event: MessageEvent) => void): void;
export declare function isMessagePort(source: MessageSource): source is MessagePort;
export declare function releaseMicrotask(): Promise<void>;
//# sourceMappingURL=utils.d.ts.map