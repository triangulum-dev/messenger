import { Observable } from "rxjs";
import { Connection } from "./connection.js";
import type { Message } from "./messages.js";
import { MessageType, observeMessage, promiseMessage } from "./messages.js";
import type { MessageSource, MessageTarget } from "./model.js";
import { addMessageEventListener, withResolvers } from "./utils.js";

export class Client {
  #messageId = 0;

  #connection: Connection;

  constructor(
    readonly id: string,
    readonly target: MessageTarget & MessageSource,
  ) {
    this.#connection = Connection.create(
      this.id,
      this.target,
    );
  }

  promise<TMessage, TResponse>(
    message: TMessage,
    abortSignal?: AbortSignal,
  ): Promise<TResponse> {
    const id = this.#messageId++;
    const { resolve, reject, promise } = withResolvers<TResponse>();
    const onMessage = (
      event: MessageEvent<Message>,
    ) => {
      if ("id" in event.data && event.data.id !== id) return;
      if (
        event.data.type ===
          MessageType.Reject
      ) {
        reject(event.data.error);
      } else if (
        event.data.type ===
          MessageType.Resolve
      ) {
        resolve(event.data.data as TResponse);
      } else {
        reject(new Error("Invalid message type"));
      }
    };
    addMessageEventListener(this.#connection.port, onMessage);
    this.#connection.port.postMessage(
      promiseMessage(id, message),
    );
    promise.finally(() => {
      this.#connection.port.removeEventListener("message", onMessage);
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

  observable<TMessage, TResponse>(
    message?: TMessage,
  ): Observable<TResponse> {
    return new Observable<TResponse>((subscriber) => {
      const onMessage = (event: MessageEvent<Message>) => {
        if (event.data.type === MessageType.Emit) {
          subscriber.next(event.data.data as TResponse);
        } else if (event.data.type === MessageType.Complete) {
          subscriber.complete();
        } else if (event.data.type === MessageType.Error) {
          subscriber.error(event.data.error);
        }
      };
      addMessageEventListener(this.#connection.port, onMessage);
      if (message) {
        this.#connection.port.postMessage(
          observeMessage(this.#messageId++, message),
        );
      }
      return () => {
        this.#connection.port.removeEventListener("message", onMessage);
      };
    });
  }

  close() {
    this.#connection.port.close();
  }
}
