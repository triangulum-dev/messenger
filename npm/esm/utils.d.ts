import { MessageTarget } from "./model.js";
export declare function withResolvers<T>(): {
    resolve: (value: T) => void;
    reject: (reason?: unknown) => void;
    promise: Promise<T>;
};
export declare function addMessageEventListener(target: MessageTarget, listener: (event: MessageEvent) => void): void;
export declare function isMessagePort(target: MessageTarget): target is MessagePort;
export declare function releaseMicrotask(): Promise<void>;
//# sourceMappingURL=utils.d.ts.map