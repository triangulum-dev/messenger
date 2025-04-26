// deno-lint-ignore no-explicit-any
export type MessageTarget<T = any> = {
  postMessage(
    message: T,
    targetOrigin: string,
    transfer?: Transferable[]
  ): void;
};

// deno-lint-ignore no-explicit-any
export type MessageSource<T = any> = {
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<T>) => void
  ): void;

  removeEventListener(
    type: "message",
    listener: (event: MessageEvent<T>) => void
  ): void;
};

export type ListenRef = {
  destroy: () => void;
};

// deno-lint-ignore no-explicit-any
export type Function = (...args: any[]) => any;

export type FunctionMap = Record<string, Function>;
