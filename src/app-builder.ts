import type { Observable } from "rxjs";
import { AppContext } from "./app-context.ts";
import type { MessageTarget } from "./model.ts";

export class AppBuilder {
  #promiseHandlers: Record<string, (...args: unknown[]) => Promise<unknown>> =
    {};
  #observableHandlers: Record<
    string,
    (...args: unknown[]) => Observable<unknown>
  > = {};
  #built = false;

  constructor(readonly target: MessageTarget) {}

  mapPromise<
    Name extends string,
    Args extends unknown[],
    Ret,
  >(
    name: Name,
    handler: (...args: Args) => Promise<Ret>,
  ): AppBuilder {
    this.#promiseHandlers[name] = handler as (
      ...args: unknown[]
    ) => Promise<unknown>;
    return this;
  }

  mapObservable<
    Name extends string,
    Args extends unknown[],
    Ret,
  >(
    name: Name,
    handler: (...args: Args) => Observable<Ret>,
  ): AppBuilder {
    this.#observableHandlers[name] = handler as (
      ...args: unknown[]
    ) => Observable<unknown>;
    return this;
  }

  build(): AppContext {
    if (this.#built) throw new Error("AppBuilder: already built");
    this.#built = true;
    const appContext = new AppContext(this.target);
    appContext.onPromise(async (data: unknown, _abortSignal: AbortSignal) => {
      const { function: fn, args } = data as {
        function: string;
        args: unknown[];
      };
      if (typeof fn !== "string" || !(fn in this.#promiseHandlers)) {
        throw new Error(`Unknown promise function: ${fn}`);
      }
      return await this.#promiseHandlers[fn](...(args ?? []));
    });
    appContext.onObservable((data: unknown) => {
      const { function: fn, args } = data as {
        function: string;
        args: unknown[];
      };
      if (typeof fn !== "string" || !(fn in this.#observableHandlers)) {
        throw new Error(`Unknown observable function: ${fn}`);
      }
      return this.#observableHandlers[fn](...(args ?? []));
    });
    return appContext;
  }
}
