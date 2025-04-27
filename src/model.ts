// deno-lint-ignore no-explicit-any
export type MessageTarget<T = any> = {
  postMessage(
    message: T,
    transfer?: Transferable[],
  ): void;
};

// deno-lint-ignore no-explicit-any
export type MessageSource<T = any> = {
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<T>) => void,
  ): void;

  removeEventListener(
    type: "message",
    listener: (event: MessageEvent<T>) => void,
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
