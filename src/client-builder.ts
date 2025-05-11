import { Client } from "./client.ts";
import type {
  AddFunctionType,
  AddObservableFunctionType,
  MessageSource,
  MessageTarget,
} from "./model.ts";
import { ProxyBuilder } from "./proxy-builder.ts";
import type { Observable } from "rxjs";
import {
  functionCallMessage,
  observableFunctionCallMessage,
} from "./messages.ts";

export class ClientBuilder<T extends object = object> {
  #proxyBuilder: ProxyBuilder<T>;
  #client: Client;
  #built = false;

  constructor(
    readonly id: string,
    readonly target: MessageTarget & MessageSource
  ) {
    this.#proxyBuilder = new ProxyBuilder<T>();
    this.#client = new Client(id, target);
  }

  addPromiseFunction<Args extends unknown[], ReturnType, Name extends string>(
    name: Name
  ): ClientBuilder<T & AddFunctionType<Name, Args, ReturnType>> {
    this.#proxyBuilder.addFunction<Args, Promise<ReturnType>>({
      name,
      func: (...args: Args) => {
        const message = functionCallMessage(name, args);
        return this.#client.promise(message);
      },
    });

    return this as unknown as ClientBuilder<
      T & AddFunctionType<Name, Args, ReturnType>
    >;
  }

  addObservableFunction<
    Args extends unknown[],
    ReturnType,
    Name extends string
  >(
    name: Name
  ): ClientBuilder<T & AddObservableFunctionType<Name, Args, ReturnType>> {
    this.#proxyBuilder.addFunction<Args, Observable<ReturnType>>({
      name,
      func: (...args: Args) => {
        const message = observableFunctionCallMessage(name, args);
        return this.#client.observable(message);
      },
    });
    return this as unknown as ClientBuilder<
      T & AddObservableFunctionType<Name, Args, ReturnType>
    >;
  }

  build(): T {
    if (this.#built) throw new Error("ClientBuilder: already built");
    this.#built = true;
    return this.#proxyBuilder.build();
  }
}
