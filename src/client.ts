import { Connection } from "./connection.ts";
import { MessageType, requestMessage } from "./messages.ts";
import type { ResponseMessage } from "./messages.ts";
import type {
  IsReadonly,
  MessageSource,
  MessageTarget,
  Promisify,
} from "./model.ts";
import { addMessageEventListener, withResolvers } from "./utils.ts";

export type FunctionsOf<T extends object> = {
  [K in keyof T as T[K] extends (...args: unknown[]) => unknown ? K : never]:
    T[K] extends (...args: infer Args) => infer R
      ? (...args: Args) => Promisify<R>
      : never;
};

export type GettersOf<T extends object> = {
  [
    K in keyof T as T[K] extends (...args: unknown[]) => unknown ? never
      : `get${Capitalize<string & K>}`
  ]: () => Promise<T[K]>;
};

export type SettersOf<T extends object> = {
  [
    K in keyof T as T[K] extends (...args: unknown[]) => unknown ? never
      : IsReadonly<T, K> extends true ? never
      : `set${Capitalize<string & K>}`
  ]: (value: T[K]) => Promise<void>;
};

export type ClientOf<T extends object> =
  & FunctionsOf<T>
  & GettersOf<T>
  & SettersOf<T>
  & {
    close: () => void;
  };

export class Client {
  #id = 0;

  #port: MessagePort;

  constructor(
    readonly id: string,
    readonly target: MessageTarget & MessageSource,
  ) {
    this.#port = Connection.connect(
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
      requestMessage(id, message),
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

  static of<T extends object>(id: string, target: MessageTarget & MessageSource) {

    const client = new Client(id, target);

    return new Proxy<ClientOf<T>>(
      {} as ClientOf<T>,
      {
        get: (target, prop) => {
          if (prop === "close") {
            return () => {
              target.close();
            };
          }
          if (typeof prop === "string") {
            return (...args: unknown[]) => {
              return client.send(prop, ...args);
            };
          }
          return undefined;
        },
      },
    );
  }

}
