import type { Observable } from "rxjs";

export type MessageTarget = {
  postMessage(
    // deno-lint-ignore no-explicit-any
    message: any,
    transfer?: Transferable[],
  ): void;
  addEventListener(
    type: "message",
    // deno-lint-ignore no-explicit-any
    listener: (event: MessageEvent<any>) => void,
  ): void;

  removeEventListener(
    type: "message",
    // deno-lint-ignore no-explicit-any
    listener: (event: MessageEvent<any>) => void,
  ): void;
};

export type ListenRef = {
  destroy: () => void;
};

// deno-lint-ignore no-explicit-any
export type Function = (...args: any[]) => any;

export type FunctionMap = Record<string, Function>;

export type Promisify<T> = T extends Promise<unknown> ? T : Promise<T>;

export type IsReadonly<T, K extends keyof T> =
  (<G>() => G extends { [P in K]: T[P] } ? 1 : 2) extends
    (<G>() => G extends { readonly [P in K]: T[P] } ? 1 : 2) ? true
    : false;

export type AddFunctionType<
  Name extends string,
  Args extends unknown[],
  ReturnType,
> = {
  [K in Name]: (...args: Args) => Promise<ReturnType>;
};

export type AddObservableFunctionType<
  Name extends string,
  Args extends unknown[],
  ReturnType,
> = {
  [K in Name]: (...args: Args) => Observable<ReturnType>;
};

export type AddPromiseFunctionType<
  Name extends string,
  Args extends unknown[],
  ReturnType,
> = {
  [K in Name]: (...args: Args) => Promise<ReturnType>;
};

// deno-lint-ignore no-explicit-any
export type AnyFn = (...args: any[]) => any;
