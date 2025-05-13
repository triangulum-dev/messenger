import { Observable } from "rxjs";
import type { Message } from "./messages.ts";
import {
  abortMessage,
  functionCallMessage,
  MessageType,
  observableFunctionCallMessage,
  promiseMessage,
  subscribeMessage,
  unsubscribeMessage,
} from "./messages.ts";
import type { AnyFn, MessageTarget } from "./model.ts";
import { addMessageEventListener, UUID, withResolvers } from "./utils.ts";

export function promise<TMessage, TResponse>(
  target: MessageTarget,
  message: TMessage,
  abortSignal?: AbortSignal,
): Promise<TResponse> {
  const id = UUID.create();
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
  addMessageEventListener(target, onMessage);
  target.postMessage(
    promiseMessage(id, message),
  );
  promise.finally(() => {
    target.removeEventListener("message", onMessage);
  });
  if (abortSignal) {
    const onAbort = () => {
      target.postMessage(abortMessage(id));
    };
    abortSignal.addEventListener("abort", onAbort, { once: true });
    promise.finally(() => {
      abortSignal.removeEventListener("abort", onAbort);
    });
  }
  return promise;
}

export function observable<TMessage, TResponse>(
  target: MessageTarget,
  message?: TMessage,
): Observable<TResponse> {
  return new Observable<TResponse>((subscriber) => {
    const id = UUID.create();
    const onMessage = (event: MessageEvent<Message>) => {
      if (event.data.type === MessageType.Emit) {
        subscriber.next(event.data.data as TResponse);
      } else if (event.data.type === MessageType.Complete) {
        subscriber.complete();
      } else if (event.data.type === MessageType.Error) {
        subscriber.error(event.data.error);
      }
    };
    addMessageEventListener(target, onMessage);
    if (message) {
      target.postMessage(
        subscribeMessage(id, message),
      );
    }
    return () => {
      target.removeEventListener("message", onMessage);
      target.postMessage(unsubscribeMessage(id));
    };
  });
}

export type Client<T> = {
  [K in keyof T as T[K] extends (...args: unknown[]) => Observable<unknown>
    ? (K extends `${string}$` ? K : `${Extract<K, string>}$`)
    : K
  ]: T[K] extends (...args: infer A) => Observable<infer R>
    ? (...args: A) => Observable<R>
    : T[K] extends (...args: infer A) => Promise<infer R>
      ? (...args: A) => Promise<R>
    : never;
};

export function client<T extends Record<string, AnyFn>>(
  target: MessageTarget,
): Client<T> {
  return new Proxy({}, {
    get(_obj, prop: string) {
      if (prop === "target") return target;
      // Find the original function name (strip trailing $ for observables)
      const isObservable = prop.endsWith("$");
      const fnName = isObservable ? prop.slice(0, -1) : prop;
      if (isObservable) {
        return (...args: unknown[]) => {
          const message = observableFunctionCallMessage(fnName, args);
          return observable(target, message);
        };
      } else {
        return (...args: unknown[]) => {
          const message = functionCallMessage(fnName, args);
          return promise(target, message);
        };
      }
    },
  }) as Client<T>;
}
