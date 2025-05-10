import type { Observable } from "rxjs";
import { Connection } from "./connection.ts";
import { MessageType, rejectMessage, resolveMessage } from "./messages.ts";
import type { ListenRef, MessageSource } from "./model.ts";
import { addMessageEventListener } from "./utils.ts";

export class Controller {
  #listenRef: ListenRef;

  #connections = new Map<Connection, (event: MessageEvent) => void>();

  #promiseCallback?: (data: unknown) => Promise<unknown>;
  
  #observableCallback?: (data: unknown) => Observable<unknown>;

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

  onPromise(handler: (data: unknown) => Promise<unknown>) {
    this.#promiseCallback = handler;
  }

  onObservable(
    handler: (data: unknown) => Observable<unknown>
  ) {
    this.#observableCallback = handler;
  }

  close() {
    this.#listenRef.destroy();
    for (const [connection, onMessage] of this.#connections) {
      connection.port.removeEventListener("message", onMessage);
      connection.port.close();
    }
  }

  #onConnect = (connection: Connection) => {
    const onMessage = (message: MessageEvent) =>
      this.#onMessage(connection, message);
    addMessageEventListener(connection.port, onMessage);
    this.#connections.set(connection, onMessage);
  };

  #onMessage = async (
    connection: Connection,
    // deno-lint-ignore no-explicit-any
    event: MessageEvent<any>,
  ) => {
    const { data } = event;
    if (data.type === MessageType.Promise) {
      await this.#handlePromise(connection, data);
    } else if (data.type === MessageType.Observable) {
      this.#handleObservable(connection, data);
    } else {
      console.error("Unknown message type:", data.type);
    }
  };

  async #handlePromise(connection: Connection, data: any) {
    if (!this.#promiseCallback) return;
    const { id, data: payload } = data;
    try {
      const result = await this.#promiseCallback(payload);
      connection.port.postMessage(resolveMessage(id, result));
    } catch (error) {
      try {
        connection.port.postMessage(rejectMessage(id, error));
      } catch (e) {
        console.error("Error sending reject message:", e);
      }
    }
  }

  #handleObservable(connection: Connection, data: any) {
    if (!this.#observableCallback) return;
    const { id, data: payload } = data;
    let completed = false;
    const observer = {
      next: (value: unknown) => {
        if (!completed) connection.port.postMessage({ type: MessageType.Emit, id, data: value });
      },
      error: (err: unknown) => {
        if (!completed) {
          completed = true;
          connection.port.postMessage({ type: MessageType.Error, id, error: err });
        }
      },
      complete: () => {
        if (!completed) {
          completed = true;
          connection.port.postMessage({ type: MessageType.Complete, id });
        }
      },
    };
    try {
      const observable = this.#observableCallback(payload);
      if (observable && typeof observable.subscribe === "function") {
        observable.subscribe(observer);
      } else {
        throw new Error("Handler did not return an observable");
      }
    } catch (err) {
      observer.error(err);
    }
  }
}
