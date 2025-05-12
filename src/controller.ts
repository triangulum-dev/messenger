import type { Observable } from "rxjs";
import type { Connection } from "./internal/connection.ts";
import { MessageType, rejectMessage, resolveMessage } from "./messages.ts";
import type { MessageTarget } from "./model.ts";
import { addMessageEventListener } from "./utils.ts";

// Message data type for Promise and Observable
interface MessageData {
  id: string;
  data: unknown;
}

export class Controller {
  #connections = new Map<Connection, (event: MessageEvent) => void>();

  #promiseCallback?: (data: unknown, abortSignal: AbortSignal) => Promise<unknown>;

  #observableCallback?: (data: unknown) => Observable<unknown>;

  // Use a single array as a deque for active requests
  #activeRequests: Array<{
    id: string;
    type: "promise" | "observable";
    data: MessageData;
    abortController?: AbortController; // Only for promise requests
  }> = [];

  constructor(
    readonly target: MessageTarget,
  ) {
    // Listener setup moved to start() method
  }

  start() {
    const onMessage = (message: MessageEvent) => this.#onMessage(message);
    addMessageEventListener(this.target, onMessage);
  }

  onPromise(handler: (data: unknown, abortSignal: AbortSignal) => Promise<unknown>) {
    this.#promiseCallback = handler;
    // Play any queued promise requests in order
    const pending = this.#activeRequests.filter((r) => r.type === "promise");
    for (const req of pending) {
      this.#handlePromise(
        req as {
          id: string;
          type: "promise";
          data: MessageData;
          abortController: AbortController;
        },
      );
    }
  }

  onObservable(
    handler: (data: unknown) => Observable<unknown>,
  ) {
    this.#observableCallback = handler;
    // Play any queued observable requests in order
    const pending = this.#activeRequests.filter((r) => r.type === "observable");
    for (const req of pending) {
      this.#handleObservable(
        req as {
          connection: Connection;
          id: string | number;
          type: "observable";
          data: MessageData;
        },
      );
    }
  }

  close() {
    // Reject/error all active requests in FIFO order before closing the port
    while (this.#activeRequests.length > 0) {
      const req = this.#activeRequests.shift();
      if (!req) break;
      if (req.type === "promise") {
        this.target.postMessage({
          type: MessageType.Reject,
          id: req.id,
          error: new Error("Connection closed"),
        });
      } else if (req.type === "observable") {
        this.target.postMessage({
          type: MessageType.Error,
          id: req.id,
          error: new Error("Connection closed"),
        });
      }
    }
    for (const [connection, onMessage] of this.#connections) {
      connection.port.removeEventListener("message", onMessage);
      connection.port.close();
    }
  }

  #onMessage = async (
    // deno-lint-ignore no-explicit-any
    event: MessageEvent<any>,
  ) => {
    const { data } = event;
    if (data.type === MessageType.Promise) {
      await this.#handlePromiseMessage(data);
    } else if (data.type === MessageType.Subscribe) {
      this.#handleObservableMessage(data);
    } else if (data.type === MessageType.Abort) {
      this.#handleAbortMessage(data);
    } else {
      console.error("Unknown message type:", data.type);
    }
  };

  async #handlePromiseMessage(data: MessageData) {
    const abortController = new AbortController();
    const req = { id: data.id, type: "promise", data, abortController } as const;
    this.#activeRequests.push(req);
    await this.#handlePromise(req);
  }

  async #handlePromise(
    req: {
      id: string;
      type: "promise";
      data: MessageData;
      abortController: AbortController;
    }
  ) {
    if (!this.#promiseCallback) return;
    try {
      const result = await this.#promiseCallback(req.data.data, req.abortController.signal);
      this.target.postMessage(resolveMessage(req.id, result));
    } catch (error) {
      try {
        this.target.postMessage(rejectMessage(req.id, error));
      } catch (e) {
        console.error("Error sending reject message:", e);
      }
    } finally {
      // Remove the first matching promise from the deque (FIFO)
      const idx = this.#activeRequests.findIndex((r) =>
        r.id === req.id &&
        r.type === "promise"
      );
      if (idx !== -1) this.#activeRequests.splice(idx, 1);
    }
  }

  #handleAbortMessage(data: { id: string }) {
    const req = this.#activeRequests.find((r) => r.id === data.id && r.type === "promise");
    if (req && req.abortController) {
      req.abortController.abort();
    }
  }

  // Handles tracking and activation for observable messages
  #handleObservableMessage(data: MessageData) {
    const req = { id: data.id, type: "observable", data } as const;
    this.#activeRequests.push(req);
    this.#handleObservable(req);
  }

  // Handles the actual observable logic
  #handleObservable(
    req: {
      id: string | number;
      type: "observable";
      data: MessageData;
    },
  ) {
    if (!this.#observableCallback) return;
    let completed = false;
    const { id, data } = req;
    const removeFromActiveRequests = () => {
      const idx = this.#activeRequests.findIndex((r) =>
        r.id === id && r.type === "observable"
      );
      if (idx !== -1) this.#activeRequests.splice(idx, 1);
    };
    const observer = {
      next: (value: unknown) => {
        if (!completed) {
          this.target.postMessage({
            type: MessageType.Emit,
            id,
            data: value,
          });
        }
      },
      error: (err: unknown) => {
        if (!completed) {
          completed = true;
          this.target.postMessage({
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
          this.target.postMessage({ type: MessageType.Complete, id });
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
