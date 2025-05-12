import { Observable } from "rxjs";
import type { Message } from "./messages.ts";
import { MessageType, observeMessage, promiseMessage } from "./messages.ts";
import type { MessageTarget } from "./model.ts";
import { addMessageEventListener, withResolvers } from "./utils.ts";

export class Client {
  #messageId = 0;

  constructor(
    readonly target: MessageTarget,
  ) {
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
    addMessageEventListener(this.target, onMessage);
    this.target.postMessage(
      promiseMessage(id, message),
    );
    promise.finally(() => {
      this.target.removeEventListener("message", onMessage);
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
      addMessageEventListener(this.target, onMessage);
      if (message) {
        this.target.postMessage(
          observeMessage(this.#messageId++, message),
        );
      }
      return () => {
        this.target.removeEventListener("message", onMessage);
      };
    });
  }

  close() {
  }
}
