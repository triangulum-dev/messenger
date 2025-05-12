"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = void 0;
exports.connectMessage = connectMessage;
exports.promiseMessage = promiseMessage;
exports.resolveMessage = resolveMessage;
exports.rejectMessage = rejectMessage;
exports.emitMessage = emitMessage;
exports.observeMessage = observeMessage;
exports.completeMessage = completeMessage;
exports.errorMessage = errorMessage;
exports.abortMessage = abortMessage;
exports.functionCallMessage = functionCallMessage;
exports.observableFunctionCallMessage = observableFunctionCallMessage;
var MessageType;
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
})(MessageType || (exports.MessageType = MessageType = {}));
function connectMessage(id) {
    return {
        type: MessageType.Connect,
        id,
    };
}
function promiseMessage(id, data) {
    return {
        type: MessageType.Promise,
        id,
        data,
    };
}
function resolveMessage(id, data) {
    return {
        type: MessageType.Resolve,
        id,
        data,
    };
}
function rejectMessage(id, error) {
    return {
        type: MessageType.Reject,
        id,
        error,
    };
}
function emitMessage(id, data) {
    return {
        type: MessageType.Emit,
        id,
        data,
    };
}
function observeMessage(id, data) {
    return {
        type: MessageType.Observable,
        id,
        data,
    };
}
function completeMessage(id) {
    return {
        type: MessageType.Complete,
        id,
    };
}
function errorMessage(id, error) {
    return {
        type: MessageType.Error,
        id,
        error,
    };
}
function abortMessage(id) {
    return {
        type: MessageType.Abort,
        id,
    };
}
function functionCallMessage(functionName, args) {
    return {
        type: MessageType.FunctionCall,
        function: functionName,
        args,
    };
}
function observableFunctionCallMessage(functionName, args) {
    return {
        type: MessageType.ObservableFunctionCall,
        function: functionName,
        args,
    };
}
