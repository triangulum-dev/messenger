import type { AsyncRejectMessage, AsyncResolveMessage } from "./messages.ts";
import { asyncRequestMessage, MessageType } from "./messages.ts";
import type { MessageSource } from "./model.ts";
import { withResolvers } from "./utils.ts";

// deno-lint-ignore no-explicit-any
export type MessengerTarget<T = any> = {
  postMessage(
    message: T,
    transfer?: Transferable[],
  ): void;
};

export type MessengerResponseMessage<T> =
  | AsyncResolveMessage<T>
  | AsyncRejectMessage;

export class Messenger {
  constructor(readonly target: MessengerTarget & MessageSource) {}

  send<TMessage, TResponse>(
    id: string,
    message: TMessage,
    abortSignal?: AbortSignal,
  ): Promise<TResponse> {
    const { resolve, reject, promise } = withResolvers<TResponse>();
    const onMessage = (
      event: MessageEvent<MessengerResponseMessage<TResponse>>,
    ) => {
      if (event.data.id !== id) return;
      if (
        event.data.type ===
          MessageType.AsyncReject
      ) {
        reject(event.data.error);
      } else if (
        event.data.type ===
          MessageType.AsyncResolve
      ) {
        resolve(event.data.data);
      } else {
        reject(new Error("Invalid message type"));
      }
    };
    this.target.addEventListener("message", onMessage);
    this.target.postMessage(
      asyncRequestMessage(id, message),
    );
    promise.finally(() => {
      this.target.removeEventListener("message", onMessage);
    });
    if (abortSignal) {
      const onAbort = () => {
        reject(new Error("Aborted"));
      };
      abortSignal.addEventListener("abort", onAbort, { once: true });
      promise.finally(() => {
        abortSignal.removeEventListener("abort", onAbort);
      });
    }
    return promise;
  }
}
