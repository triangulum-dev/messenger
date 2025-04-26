import type { AsyncRequestMessage } from "./messages.ts";
import { ChannelConnection } from "./channel-connection.ts";
import {
  asyncRejectMessage,
  asyncResolveMessage,
  MessageType,
} from "./messages.ts";
import type {
  Function,
  FunctionMap,
  ListenRef,
  MessageSource,
} from "./model.ts";

export type MessengerControllerHandler<T extends Function = Function> = (
  ...args: Parameters<T>
) => ReturnType<T>;

export class MessengerController<T extends FunctionMap> {
  #listenRef: ListenRef;

  #connections = new Map<MessagePort, (event: MessageEvent) => void>();

  #callback?: MessengerControllerHandler;

  constructor(
    readonly id: string,
    readonly source: MessageSource,
    readonly sourceOrigin: string,
  ) {
    this.#listenRef = ChannelConnection.listen(
      this.id,
      this.source,
      this.sourceOrigin,
      this.#onConnect,
    );
  }

  #onConnect = (port: MessagePort) => {
    const onMessage = (message: MessageEvent) => this.#onMessage(port, message);
    port.addEventListener(
      "message",
      onMessage,
    );
    this.#connections.set(port, onMessage);
  };

  #onMessage = async (
    port: MessagePort,
    event: MessageEvent<AsyncRequestMessage<unknown>>,
  ) => {
    if (event.data.type !== MessageType.AsyncRequest) {
      return;
    }
    const { id, data } = event.data;
    if (this.#callback) {
      try {
        const result = await this.#callback(data);
        port.postMessage(asyncResolveMessage(id, result));
      } catch (error) {
        port.postMessage(asyncRejectMessage(id, error));
      }
    }
  };

  on<F extends T[keyof T]>(
    handler: MessengerControllerHandler<F>,
  ) {
    this.#callback = handler;
  }

  destroy() {
    this.#listenRef.destroy();
    for (const [port, onMessage] of this.#connections) {
      port.removeEventListener("message", onMessage);
      port.close();
    }
  }
}
