export declare enum MessageType {
    Connect = "@triangulum/messenger/v1/messages/connect",
    Promise = "@triangulum/messenger/v1/messages/promise",
    Resolve = "@triangulum/messenger/v1/messages/resolve",
    Reject = "@triangulum/messenger/v1/messages/reject",
    Observable = "@triangulum/messenger/v1/messages/observable",
    Emit = "@triangulum/messenger/v1/messages/emit",
    Complete = "@triangulum/messenger/v1/messages/complete",
    Error = "@triangulum/messenger/v1/messages/error",
    FunctionCall = "@triangulum/messenger/v1/messages/function_call",
    ObservableFunctionCall = "@triangulum/messenger/v1/messages/observable_function_call"
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
export type ObserveMessage<T> = {
    type: MessageType.Observable;
    id: string | number;
    data: T;
};
export declare function observeMessage<T>(id: string | number, data: T): ObserveMessage<T>;
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
export type Message = ConnectMessage | PromiseMessage<unknown> | ResolveMessage<unknown> | RejectMessage | ObserveMessage<unknown> | EmitMessage<unknown> | CompleteMessage | ErrorMessage | FunctionCallMessage | ObservableFunctionCallMessage;
//# sourceMappingURL=messages.d.ts.map