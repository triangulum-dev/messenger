import type { Observable } from "rxjs";
import { Controller } from "./controller.ts";
import type { AddObservableFunctionType, AddPromiseFunctionType, MessageTarget } from "./model.ts";

export type PromiseHandlerDef<Args extends unknown[], ReturnType> = {
  type: "promise";
  handler: (...args: Args) => Promise<ReturnType>;
};

export type ObservableHandlerDef<Args extends unknown[], ReturnType> = {
  type: "observable";
  handler: (...args: Args) => Observable<ReturnType>;
};

export type HandlerDefUnion = PromiseHandlerDef<any[], any> | ObservableHandlerDef<any[], any>;

export type ExtractHandlerArgs<Def extends HandlerDefUnion> =
  Def extends PromiseHandlerDef<infer Args, unknown> ? Args :
  Def extends ObservableHandlerDef<infer Args, unknown> ? Args : never;

export type ExtractHandlerReturnType<Def extends HandlerDefUnion> =
  Def extends PromiseHandlerDef<unknown[], infer Ret> ? Ret :
  Def extends ObservableHandlerDef<unknown[], infer Ret> ? Ret : never;

export function promiseHandler<Args extends unknown[], ReturnType>(
  handler: (...args: Args) => Promise<ReturnType>
): PromiseHandlerDef<Args, ReturnType> {
  return { type: "promise", handler };
}

export function observableHandler<Args extends unknown[], ReturnType>(
  handler: (...args: Args) => Observable<ReturnType>
): ObservableHandlerDef<Args, ReturnType> {
  return { type: "observable", handler };
}

export class ControllerBuilder<T extends object = object> {
  #promiseHandlers: Record<string, (...args: unknown[]) => Promise<unknown>> =
    {};
  #observableHandlers: Record<
    string,
    (...args: unknown[]) => Observable<unknown>
  > = {};
  #built = false;

  constructor(readonly target: MessageTarget) {
  }

  add<
    Name extends string,
    Def extends HandlerDefUnion
  >(
    name: Name,
    definition: Def
  ): ControllerBuilder<
    T &
      (Def extends { type: "promise" }
        ? AddPromiseFunctionType<Name, ExtractHandlerArgs<Def>, ExtractHandlerReturnType<Def>>
        : AddObservableFunctionType<Name, ExtractHandlerArgs<Def>, ExtractHandlerReturnType<Def>>)
  > {
    type Args = ExtractHandlerArgs<Def>;
    type Ret = ExtractHandlerReturnType<Def>;

    if (definition.type === "promise") {
      const handler = (definition as PromiseHandlerDef<Args, Ret>).handler;
      this.#promiseHandlers[name] = handler as (...args: unknown[]) => Promise<unknown>;
    } else { // definition.type === "observable"
      const handler = (definition as ObservableHandlerDef<Args, Ret>).handler;
      this.#observableHandlers[name] = handler as (...args: unknown[]) => Observable<unknown>;
    }

    return this as unknown as ControllerBuilder<
      T &
        (Def extends { type: "promise" }
          ? AddPromiseFunctionType<Name, ExtractHandlerArgs<Def>, ExtractHandlerReturnType<Def>>
          : AddObservableFunctionType<Name, ExtractHandlerArgs<Def>, ExtractHandlerReturnType<Def>>)
    >;
  }

  build(): Controller {
    if (this.#built) throw new Error("ControllerBuilder: already built");
    this.#built = true;
    const controller = new Controller(this.target);
    // deno-lint-ignore no-explicit-any
    controller.onPromise(async ({ function: fn, args }: any) => {
      if (typeof fn !== "string" || !(fn in this.#promiseHandlers)) {
        throw new Error(`Unknown promise function: ${fn}`);
      }
      return await this.#promiseHandlers[fn](...(args ?? []));
    });
    // deno-lint-ignore no-explicit-any
    controller.onObservable(({ function: fn, args }: any) => {
      if (typeof fn !== "string" || !(fn in this.#observableHandlers)) {
        throw new Error(`Unknown observable function: ${fn}`);
      }
      return this.#observableHandlers[fn](...(args ?? []));
    });
    return controller;
  }
}
