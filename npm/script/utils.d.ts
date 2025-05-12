import { MessageTarget } from "./model.js";
export declare function withResolvers<T>(): {
    resolve: (value: T) => void;
    reject: (reason?: unknown) => void;
    promise: Promise<T>;
};
export declare function addMessageEventListener(target: MessageTarget, listener: (event: MessageEvent) => void): void;
export declare function isMessagePort(target: MessageTarget): target is MessagePort;
export declare function releaseMicrotask(): Promise<void>;
export declare class UUID {
    static create(): `${string}-${string}-${string}-${string}-${string}`;
}
//# sourceMappingURL=utils.d.ts.map