export enum MessageType {
  AsyncReject = "@triangulum/messenger/messages/async-reject-message",
  AsyncResolve = "@triangulum/messenger/messages/async-resolve-message",
  AsyncRequest = "@triangulum/messenger/messages/async-request-message",
  Connect = "@triangulum/messenger/messages/connect",
}

export type ConnectMessage = {
  type: MessageType.Connect;
  port: MessagePort;
  id: string;
};

export function connectMessage(
  id: string,
  port: MessagePort,
): ConnectMessage {
  return {
    type: MessageType.Connect,
    port,
    id,
  };
} 

export type AsyncRequestMessage<T> = {
  type: MessageType.AsyncRequest;
  id: string;
  data: T;
};

export function asyncRequestMessage<T>(
  id: string,
  data: T,
): AsyncRequestMessage<T> {
  return {
    type: MessageType.AsyncRequest,
    id,
    data,
  };
}

export type AsyncResolveMessage<T> = {
  type: MessageType.AsyncResolve;
  id: string;
  data: T;
};

export function asyncResolveMessage<T>(
  id: string,
  data: T,
): AsyncResolveMessage<T> {
  return {
    type: MessageType.AsyncResolve,
    id,
    data,
  };
}

export type AsyncRejectMessage = {
  type: MessageType.AsyncReject;
  id: string;
  error: unknown;
};

export function asyncRejectMessage(
  id: string,
  error: unknown,
): AsyncRejectMessage {
  return {
    type: MessageType.AsyncReject,
    id,
    error,
  };
}
