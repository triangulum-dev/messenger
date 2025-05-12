export var MessageType;
(function (MessageType) {
    MessageType["Connect"] = "@triangulum/messenger/v1/messages/connect";
    MessageType["Promise"] = "@triangulum/messenger/v1/messages/promise";
    MessageType["Resolve"] = "@triangulum/messenger/v1/messages/resolve";
    MessageType["Reject"] = "@triangulum/messenger/v1/messages/reject";
    MessageType["Observable"] = "@triangulum/messenger/v1/messages/observable";
    MessageType["Emit"] = "@triangulum/messenger/v1/messages/emit";
    MessageType["Complete"] = "@triangulum/messenger/v1/messages/complete";
    MessageType["Error"] = "@triangulum/messenger/v1/messages/error";
    MessageType["FunctionCall"] = "@triangulum/messenger/v1/messages/function_call";
    MessageType["ObservableFunctionCall"] = "@triangulum/messenger/v1/messages/observable_function_call";
    MessageType["Abort"] = "@triangulum/messenger/v1/messages/abort";
})(MessageType || (MessageType = {}));
export function connectMessage(id) {
    return {
        type: MessageType.Connect,
        id,
    };
}
export function promiseMessage(id, data) {
    return {
        type: MessageType.Promise,
        id,
        data,
    };
}
export function resolveMessage(id, data) {
    return {
        type: MessageType.Resolve,
        id,
        data,
    };
}
export function rejectMessage(id, error) {
    return {
        type: MessageType.Reject,
        id,
        error,
    };
}
export function emitMessage(id, data) {
    return {
        type: MessageType.Emit,
        id,
        data,
    };
}
export function observeMessage(id, data) {
    return {
        type: MessageType.Observable,
        id,
        data,
    };
}
export function completeMessage(id) {
    return {
        type: MessageType.Complete,
        id,
    };
}
export function errorMessage(id, error) {
    return {
        type: MessageType.Error,
        id,
        error,
    };
}
export function abortMessage(id) {
    return {
        type: MessageType.Abort,
        id,
    };
}
export function functionCallMessage(functionName, args) {
    return {
        type: MessageType.FunctionCall,
        function: functionName,
        args,
    };
}
export function observableFunctionCallMessage(functionName, args) {
    return {
        type: MessageType.ObservableFunctionCall,
        function: functionName,
        args,
    };
}
