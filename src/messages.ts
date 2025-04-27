export enum MessageType {
  Connect = "@triangulum/messenger/messages/connect",
  Reject = "@triangulum/messenger/messages/reject",
  Request = "@triangulum/messenger/messages/request",
  Resolve = "@triangulum/messenger/messages/resolve",
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

export type AsyncRequestMessage<T> = {
  type: MessageType.Request;
  id: string | number;
  data: T;
};

export function asyncRequestMessage<T>(
  id: string | number,
  data: T,
): AsyncRequestMessage<T> {
  return {
    type: MessageType.Request,
    id,
    data,
  };
}

export type AsyncResolveMessage<T> = {
  type: MessageType.Resolve;
  id: string | number;
  data: T;
};

export function resolveMessage<T>(
  id: string | number,
  data: T,
): AsyncResolveMessage<T> {
  return {
    type: MessageType.Resolve,
    id,
    data,
  };
}

export type AsyncRejectMessage = {
  type: MessageType.Reject;
  id: string | number;
  error: unknown;
};

export function asyncRejectMessage(
  id: string | number,
  error: unknown,
): AsyncRejectMessage {
  return {
    type: MessageType.Reject,
    id,
    error,
  };
}

export type ResponseMessage<T> = 
  | AsyncResolveMessage<T>
  | AsyncRejectMessage;