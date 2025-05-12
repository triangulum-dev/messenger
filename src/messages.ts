export enum MessageType {
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
  ObservableFunctionCall =
    "@triangulum/messenger/v1/messages/observable_function_call",
  Abort = "@triangulum/messenger/v1/messages/abort",
}

export type ConnectMessage = {
  type: MessageType.Connect;
  id: string;
};

export function connectMessage(
  id: string,
): ConnectMessage {
  return {
    type: MessageType.Connect,
    id,
  };
}

export type PromiseMessage<T> = {
  type: MessageType.Promise;
  id: string | number;
  data: T;
};

export function promiseMessage<T>(
  id: string | number,
  data: T,
): PromiseMessage<T> {
  return {
    type: MessageType.Promise,
    id,
    data,
  };
}

export type ResolveMessage<T> = {
  type: MessageType.Resolve;
  id: string | number;
  data: T;
};

export function resolveMessage<T>(
  id: string | number,
  data: T,
): ResolveMessage<T> {
  return {
    type: MessageType.Resolve,
    id,
    data,
  };
}

export type RejectMessage = {
  type: MessageType.Reject;
  id: string | number;
  error: unknown;
};

export function rejectMessage(
  id: string | number,
  error: unknown,
): RejectMessage {
  return {
    type: MessageType.Reject,
    id,
    error,
  };
}

export type EmitMessage<T> = {
  type: MessageType.Emit;
  id: string | number;
  data: T;
};

export function emitMessage<T>(
  id: string | number,
  data: T,
): EmitMessage<T> {
  return {
    type: MessageType.Emit,
    id,
    data,
  };
}

export type SubscribeMessage<T> = {
  type: MessageType.Subscribe;
  id: string | number;
  data: T;
};

export function subscribeMessage<T>(
  id: string | number,
  data: T,
): SubscribeMessage<T> {
  return {
    type: MessageType.Subscribe,
    id,
    data,
  };
}

export type UnsubscribeMessage = {
  type: MessageType.Unsubscribe;
  id: string | number;
};

export function unsubscribeMessage(
  id: string | number,
): UnsubscribeMessage {
  return {
    type: MessageType.Unsubscribe,
    id,
  };
}

export type CompleteMessage = {
  type: MessageType.Complete;
  id: string | number;
};

export function completeMessage(
  id: string | number,
): CompleteMessage {
  return {
    type: MessageType.Complete,
    id,
  };
}

export type ErrorMessage = {
  type: MessageType.Error;
  id: string | number;
  error: unknown;
};

export function errorMessage(
  id: string | number,
  error: unknown,
): ErrorMessage {
  return {
    type: MessageType.Error,
    id,
    error,
  };
}

export function abortMessage(id: string | number) {
  return {
    type: MessageType.Abort,
    id,
  };
}

export type FunctionCallMessage = {
  type: MessageType.FunctionCall;
  function: string;
  args: unknown[];
};

export function functionCallMessage(
  functionName: string,
  args: unknown[],
): FunctionCallMessage {
  return {
    type: MessageType.FunctionCall,
    function: functionName,
    args,
  };
}

export type ObservableFunctionCallMessage = {
  type: MessageType.ObservableFunctionCall;
  function: string;
  args: unknown[];
};

export function observableFunctionCallMessage(
  functionName: string,
  args: unknown[],
): ObservableFunctionCallMessage {
  return {
    type: MessageType.ObservableFunctionCall,
    function: functionName,
    args,
  };
}

export type Message =
  | ConnectMessage
  | PromiseMessage<unknown>
  | ResolveMessage<unknown>
  | RejectMessage
  | SubscribeMessage<unknown>
  | EmitMessage<unknown>
  | CompleteMessage
  | ErrorMessage
  | FunctionCallMessage
  | ObservableFunctionCallMessage;
