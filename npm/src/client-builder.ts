import { observable, promise } from "./client.js";
import type {
  AddFunctionType,
  AddObservableFunctionType,
  MessageTarget,
} from "./model.js";
import type { Observable } from "rxjs";
import {
  functionCallMessage,
  observableFunctionCallMessage,
} from "./messages.js";

export type PromiseFunctionDef<Args extends unknown[], ReturnType> = {
  type: "promise";
  _phantom?: [Args, ReturnType];
};

export type ObservableFunctionDef<Args extends unknown[], ReturnType> = {
  type: "observable";
  _phantom?: [Args, ReturnType];
};

export type FunctionDef<Args extends unknown[], ReturnType> =
  | PromiseFunctionDef<Args, ReturnType>
  | ObservableFunctionDef<Args, ReturnType>;

export type ExtractArgs<T extends FunctionDef<unknown[], unknown>> = T extends
  FunctionDef<infer Args, unknown> ? Args : never;

export type ExtractReturnType<T extends FunctionDef<unknown[], unknown>> =
  T extends FunctionDef<unknown[], infer ReturnType> ? ReturnType : never;

export function promiseFunction<
  Args extends unknown[],
  ReturnType,
>(): PromiseFunctionDef<Args, ReturnType> {
  return { type: "promise" };
}

export function observableFunction<
  Args extends unknown[],
  ReturnType,
>(): ObservableFunctionDef<Args, ReturnType> {
  return { type: "observable" };
}

export class ClientBuilder<T extends object = object> {
  #serviceObject: Record<
    string,
    | ((...args: unknown[]) => Promise<unknown>)
    | ((...args: unknown[]) => Observable<unknown>)
  >;
  #built = false;

  constructor(
    readonly target: MessageTarget,
  ) {
    this.#serviceObject = {};
  }

  add<Name extends string, Def extends FunctionDef<unknown[], unknown>>(
    name: Name,
    definition: Def,
  ): ClientBuilder<
    & T
    & (Def extends { type: "promise" }
      ? AddFunctionType<Name, ExtractArgs<Def>, ExtractReturnType<Def>>
      : AddObservableFunctionType<
        Name,
        ExtractArgs<Def>,
        ExtractReturnType<Def>
      >)
  > {
    if (definition.type === "promise") {
      this.#serviceObject[name] = (
        (...args: ExtractArgs<Def>): Promise<ExtractReturnType<Def>> => {
          const message = functionCallMessage(name, args);
          return promise(this.target, message);
        }
      ) as (...args: unknown[]) => Promise<unknown>;
    } else {
      this.#serviceObject[name] = (
        (...args: ExtractArgs<Def>): Observable<ExtractReturnType<Def>> => {
          const message = observableFunctionCallMessage(name, args);
          return observable(this.target, message);
        }
      ) as (...args: unknown[]) => Observable<unknown>;
    }

    return this as unknown as ClientBuilder<
      & T
      & (Def extends { type: "promise" }
        ? AddFunctionType<Name, ExtractArgs<Def>, ExtractReturnType<Def>>
        : AddObservableFunctionType<
          Name,
          ExtractArgs<Def>,
          ExtractReturnType<Def>
        >)
    >;
  }

  build(): T {
    if (this.#built) throw new Error("ClientBuilder: already built");
    this.#built = true;
    return this.#serviceObject as T;
  }
}
