import type { Observable } from "rxjs";
import { Controller } from "./controller.ts";
import type { AddObservableFunctionType, AddPromiseFunctionType, MessageSource } from "./model.ts";
import { ProxyBuilder } from "./proxy-builder.ts";

export class ControllerBuilder<T extends object = object> {
  #proxyBuilder: ProxyBuilder<T>;
  #promiseHandlers: Record<string, (...args: unknown[]) => Promise<unknown>> =
    {};
  #observableHandlers: Record<
    string,
    (...args: unknown[]) => Observable<unknown>
  > = {};
  #built = false;

  constructor() {
    this.#proxyBuilder = new ProxyBuilder<T>();
  }

  addPromiseFunctionHandler<
    Name extends string,
    Args extends unknown[],
    ReturnType,
  >(
    name: Name,
    handler: (...args: Args) => Promise<ReturnType>,
  ): ControllerBuilder<T & AddPromiseFunctionType<Name, Args, ReturnType>> {
    this.#promiseHandlers[name] = handler as (
      ...args: unknown[]
    ) => Promise<unknown>;
    this.#proxyBuilder.addFunction<Args, Promise<ReturnType>>({
      name,
      func: handler,
    });
    return this as unknown as ControllerBuilder<
      T & AddPromiseFunctionType<Name, Args, ReturnType>
    >;
  }

  addObservableFunctionHandler<
    Name extends string,
    Args extends unknown[],
    ReturnType,
  >(
    name: Name,
    handler: (...args: Args) => Observable<ReturnType>,
  ): ControllerBuilder<T & AddObservableFunctionType<Name, Args, ReturnType>> {
    this.#observableHandlers[name] = handler as (
      ...args: unknown[]
    ) => Observable<unknown>;
    this.#proxyBuilder.addFunction<Args, Observable<ReturnType>>({
      name,
      func: handler,
    });
    return this as unknown as ControllerBuilder<
      T & AddObservableFunctionType<Name, Args, ReturnType>
    >;
  }

  build(id: string, source: MessageSource): T {
    if (this.#built) throw new Error("ControllerBuilder: already built");
    this.#built = true;
    const controller = new Controller(id, source);
    controller.onPromise(async ({ function: fn, args }: any) => {
      if (typeof fn !== "string" || !(fn in this.#promiseHandlers)) {
        throw new Error(`Unknown promise function: ${fn}`);
      }
      return await this.#promiseHandlers[fn](...(args ?? []));
    });
    controller.onObservable(({ function: fn, args }: any) => {
      if (typeof fn !== "string" || !(fn in this.#observableHandlers)) {
        throw new Error(`Unknown observable function: ${fn}`);
      }
      return this.#observableHandlers[fn](...(args ?? []));
    });
    return this.#proxyBuilder.build();
  }
}
