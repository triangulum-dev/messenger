import type { Observable } from "rxjs";
import { Connection } from "./connection.js";
import { MessageType, rejectMessage, resolveMessage } from "./messages.js";
import type { ListenRef, MessageSource } from "./model.js";
import { addMessageEventListener } from "./utils.js";

// Message data type for Promise and Observable
interface MessageData {
  id: string | number;
  data: unknown;
}

export class Controller {
  #listenRef: ListenRef;

  #connections = new Map<Connection, (event: MessageEvent) => void>();

  #promiseCallback?: (data: unknown) => Promise<unknown>;

  #observableCallback?: (data: unknown) => Observable<unknown>;

  // Use a single array as a deque for active requests
  #activeRequests: Array<{
    connection: Connection;
    id: string | number;
    type: 'promise' | 'observable';
    data: MessageData;
  }> = [];

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
    // Play any queued promise requests in order
    const pending = this.#activeRequests.filter(r => r.type === 'promise');
    for (const req of pending) {
      this.#handlePromise(req as { connection: Connection; id: string | number; type: 'promise'; data: MessageData });
    }
  }

  onObservable(
    handler: (data: unknown) => Observable<unknown>,
  ) {
    this.#observableCallback = handler;
    // Play any queued observable requests in order
    const pending = this.#activeRequests.filter(r => r.type === 'observable');
    for (const req of pending) {
      this.#handleObservable(req as { connection: Connection; id: string | number; type: 'observable'; data: MessageData });
    }
  }

  close() {
    this.#listenRef.destroy();
    // Reject/error all active requests in FIFO order before closing the port
    while (this.#activeRequests.length > 0) {
      const req = this.#activeRequests.shift();
      if (!req) break;
      if (req.type === 'promise') {
        req.connection.port.postMessage({ type: MessageType.Reject, id: req.id, error: new Error("Connection closed") });
      } else if (req.type === 'observable') {
        req.connection.port.postMessage({ type: MessageType.Error, id: req.id, error: new Error("Connection closed") });
      }
    }
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
      await this.#handlePromiseMessage(connection, data);
    } else if (data.type === MessageType.Observable) {
      this.#handleObservableMessage(connection, data);
    } else {
      console.error("Unknown message type:", data.type);
    }
  };

  async #handlePromiseMessage(connection: Connection, data: MessageData) {
    const req = { connection, id: data.id, type: 'promise', data } as const;
    this.#activeRequests.push(req);
    await this.#handlePromise(req);
  }

  async #handlePromise(req: { connection: Connection; id: string | number; type: 'promise'; data: MessageData }) {
    if (!this.#promiseCallback) return;
    try {
      const result = await this.#promiseCallback(req.data.data);
      req.connection.port.postMessage(resolveMessage(req.id, result));
    } catch (error) {
      try {
        req.connection.port.postMessage(rejectMessage(req.id, error));
      } catch (e) {
        console.error("Error sending reject message:", e);
      }
    } finally {
      // Remove the first matching promise from the deque (FIFO)
      const idx = this.#activeRequests.findIndex(r => r.connection === req.connection && r.id === req.id && r.type === 'promise');
      if (idx !== -1) this.#activeRequests.splice(idx, 1);
    }
  }

  // Handles tracking and activation for observable messages
  #handleObservableMessage(connection: Connection, data: MessageData) {
    const req = { connection, id: data.id, type: 'observable', data } as const;
    this.#activeRequests.push(req);
    this.#handleObservable(req);
  }

  // Handles the actual observable logic
  #handleObservable(req: { connection: Connection; id: string | number; type: 'observable'; data: MessageData }) {
    if (!this.#observableCallback) return;
    let completed = false;
    const { connection, id, data } = req;
    const removeFromActiveRequests = () => {
      const idx = this.#activeRequests.findIndex(r => r.connection === connection && r.id === id && r.type === 'observable');
      if (idx !== -1) this.#activeRequests.splice(idx, 1);
    };
    const observer = {
      next: (value: unknown) => {
        if (!completed) {
          connection.port.postMessage({
            type: MessageType.Emit,
            id,
            data: value,
          });
        }
      },
      error: (err: unknown) => {
        if (!completed) {
          completed = true;
          connection.port.postMessage({
            type: MessageType.Error,
            id,
            error: err,
          });
          removeFromActiveRequests();
        }
      },
      complete: () => {
        if (!completed) {
          completed = true;
          connection.port.postMessage({ type: MessageType.Complete, id });
          removeFromActiveRequests();
        }
      },
    };
    try {
      const observable = this.#observableCallback(data.data);
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
