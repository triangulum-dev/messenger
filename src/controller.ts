import type { AsyncRequestMessage } from "./messages.ts";
import { Connection } from "./connection.ts";
import {
  rejectMessage,
  resolveMessage,
  MessageType,
} from "./messages.ts";
import type {
  Function,
  FunctionMap,
  ListenRef,
  MessageSource,
} from "./model.ts";
import { addMessageEventListener } from "./utils.ts";

export type ControllerHandler<T extends Function = Function> = (
  ...args: Parameters<T>
) => ReturnType<T>;

export class Controller<T extends FunctionMap> {
  #listenRef: ListenRef;

  #connections = new Map<MessagePort, (event: MessageEvent) => void>();

  #callback?: ControllerHandler;

  constructor(
    readonly id: string,
    readonly source: MessageSource,
  ) {
    this.#listenRef = Connection.listen(
      this.id,
      this.source,
      this.#onConnect,
    );
  }

  on<F extends T[keyof T]>(
    handler: ControllerHandler<F>,
  ) {
    this.#callback = handler;
  }

  close() {
    this.#listenRef.destroy();
    for (const [port, onMessage] of this.#connections) {
      port.removeEventListener("message", onMessage);
      port.close();
    }
  }

  #onConnect = (port: MessagePort) => {
    const onMessage = (message: MessageEvent) => this.#onMessage(port, message);
    addMessageEventListener(port, onMessage);
    this.#connections.set(port, onMessage);
  };

  #onMessage = async (
    port: MessagePort,
    event: MessageEvent<AsyncRequestMessage<unknown>>,
  ) => {
    if (event.data.type !== MessageType.Request) {
      return;
    }
    const { id, data } = event.data;
    if (this.#callback) {
      try {
        const result = await this.#callback(data);
        port.postMessage(resolveMessage(id, result));
      } catch (error) {
        try {
          port.postMessage(rejectMessage(id, error));
        } catch (e) {
          console.error("Error sending error message:", e);
        }
      }
    }
  };
}
