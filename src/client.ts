import { ChannelConnection } from "./channel-connection.ts";
import { asyncRequestMessage, MessageType } from "./messages.ts";
import type { ResponseMessage } from "./messages.ts";
import type { MessageSource, MessageTarget } from "./model.ts";
import { addMessageEventListener, withResolvers } from "./utils.ts";

export class MessengerClient {
  #id = 0;

  #port: MessagePort;

  constructor(
    readonly id: string,
    readonly target: MessageTarget & MessageSource,
  ) {
    this.#port = ChannelConnection.connect(
      this.id,
      this.target,
    );
  }

  send<TMessage, TResponse>(
    message: TMessage,
    abortSignal?: AbortSignal,
  ): Promise<TResponse> {
    const id = this.#id++;
    const { resolve, reject, promise } = withResolvers<TResponse>();
    const onMessage = (
      event: MessageEvent<ResponseMessage<TResponse>>,
    ) => {
      if (event.data.id !== id) return;
      if (
        event.data.type ===
          MessageType.Reject
      ) {
        reject(event.data.error);
      } else if (
        event.data.type ===
          MessageType.Resolve
      ) {
        resolve(event.data.data);
      } else {
        reject(new Error("Invalid message type"));
      }
    };
    addMessageEventListener(this.#port, onMessage);
    this.#port.postMessage(
      asyncRequestMessage(id, message),
    );
    promise.finally(() => {
      this.#port.removeEventListener("message", onMessage);
    });
    if (abortSignal) {
      const onAbort = () => {
        reject(new Error(abortSignal.reason));
      };
      abortSignal.addEventListener("abort", onAbort, { once: true });
      promise.finally(() => {
        abortSignal.removeEventListener("abort", onAbort);
      });
    }
    return promise;
  }

  close() {
    this.#port.close();
  }
}
