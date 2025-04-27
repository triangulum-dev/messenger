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

export function requestMessage<T>(
  id: string | number,
  data: T,
): AsyncRequestMessage<T> {
  return {
    type: MessageType.Request,
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

export type ResponseMessage<T> = 
  | ResolveMessage<T>
  | RejectMessage;