import type { Observable } from "rxjs";
import type { AppContext } from "./app-context.js";

export class AppReference {
  #appContext: AppContext;
  #promiseHandlers: Record<string, (...args: unknown[]) => Promise<unknown>>;
  #observableHandlers: Record<
    string,
    (...args: unknown[]) => Observable<unknown>
  >;
  #started = false;

  constructor(
    appContext: AppContext,
    promiseHandlers: Record<string, (...args: unknown[]) => Promise<unknown>>,
    observableHandlers: Record<
      string,
      (...args: unknown[]) => Observable<unknown>
    >,
  ) {
    this.#appContext = appContext;
    this.#promiseHandlers = promiseHandlers;
    this.#observableHandlers = observableHandlers;
  }

  run(): void {
    if (!this.#started) {
      this.#appContext.onPromise(
        async (data: unknown, _abortSignal: AbortSignal) => {
          const { function: fn, args } = data as {
            function: string;
            args: unknown[];
          };
          if (typeof fn !== "string" || !(fn in this.#promiseHandlers)) {
            throw new Error(`Unknown promise function: ${fn}`);
          }
          return await this.#promiseHandlers[fn](...(args ?? []));
        },
      );
      this.#appContext.onObservable((data: unknown) => {
        const { function: fn, args } = data as {
          function: string;
          args: unknown[];
        };
        if (typeof fn !== "string" || !(fn in this.#observableHandlers)) {
          throw new Error(`Unknown observable function: ${fn}`);
        }
        return this.#observableHandlers[fn](...(args ?? []));
      });
      this.#started = true;
      this.#appContext.start();
    }
  }
}
