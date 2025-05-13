export declare enum MessageType {
    Connect = "@triangulum/messenger/v1/messages/connect",
    Promise = "@triangulum/messenger/v1/messages/promise",
    Resolve = "@triangulum/messenger/v1/messages/resolve",
    Reject = "@triangulum/messenger/v1/messages/reject",
    Subscribe = "@triangulum/messenger/v1/messages/subscribe",
    Unsubscribe = "@triangulum/messenger/v1/messages/unsubscribe",
    Emit = "@triangulum/messenger/v1/messages/emit",
    Complete = "@triangulum/messenger/v1/messages/complete",
    Error = "@triangulum/messenger/v1/messages/error",
    FunctionCall = "@triangulum/messenger/v1/messages/function_call",
    ObservableFunctionCall = "@triangulum/messenger/v1/messages/observable_function_call",
    Abort = "@triangulum/messenger/v1/messages/abort"
}
export type ConnectMessage = {
    type: MessageType.Connect;
    id: string;
};
export declare function connectMessage(id: string): ConnectMessage;
export type PromiseMessage<T> = {
    type: MessageType.Promise;
    id: string | number;
    data: T;
};
export declare function promiseMessage<T>(id: string | number, data: T): PromiseMessage<T>;
export type ResolveMessage<T> = {
    type: MessageType.Resolve;
    id: string | number;
    data: T;
};
export declare function resolveMessage<T>(id: string | number, data: T): ResolveMessage<T>;
export type RejectMessage = {
    type: MessageType.Reject;
    id: string | number;
    error: unknown;
};
export declare function rejectMessage(id: string | number, error: unknown): RejectMessage;
export type EmitMessage<T> = {
    type: MessageType.Emit;
    id: string | number;
    data: T;
};
export declare function emitMessage<T>(id: string | number, data: T): EmitMessage<T>;
export type SubscribeMessage<T> = {
    type: MessageType.Subscribe;
    id: string | number;
    data: T;
};
export declare function subscribeMessage<T>(id: string | number, data: T): SubscribeMessage<T>;
export type UnsubscribeMessage = {
    type: MessageType.Unsubscribe;
    id: string | number;
};
export declare function unsubscribeMessage(id: string | number): UnsubscribeMessage;
export type CompleteMessage = {
    type: MessageType.Complete;
    id: string | number;
};
export declare function completeMessage(id: string | number): CompleteMessage;
export type ErrorMessage = {
    type: MessageType.Error;
    id: string | number;
    error: unknown;
};
export declare function errorMessage(id: string | number, error: unknown): ErrorMessage;
export declare function abortMessage(id: string | number): {
    type: MessageType;
    id: string | number;
};
export type FunctionCallMessage = {
    type: MessageType.FunctionCall;
    function: string;
    args: unknown[];
};
export declare function functionCallMessage(functionName: string, args: unknown[]): FunctionCallMessage;
export type ObservableFunctionCallMessage = {
    type: MessageType.ObservableFunctionCall;
    function: string;
    args: unknown[];
};
export declare function observableFunctionCallMessage(functionName: string, args: unknown[]): ObservableFunctionCallMessage;
export type Message = ConnectMessage | PromiseMessage<unknown> | ResolveMessage<unknown> | RejectMessage | SubscribeMessage<unknown> | EmitMessage<unknown> | CompleteMessage | ErrorMessage | FunctionCallMessage | ObservableFunctionCallMessage;
//# sourceMappingURL=messages.d.ts.map