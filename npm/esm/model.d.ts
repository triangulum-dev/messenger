import type { Observable } from "rxjs";
export type MessageTarget = {
    postMessage(message: any, transfer?: Transferable[]): void;
    addEventListener(type: "message", listener: (event: MessageEvent<any>) => void): void;
    removeEventListener(type: "message", listener: (event: MessageEvent<any>) => void): void;
};
export type ListenRef = {
    destroy: () => void;
};
export type Function = (...args: any[]) => any;
export type FunctionMap = Record<string, Function>;
export type Promisify<T> = T extends Promise<unknown> ? T : Promise<T>;
export type IsReadonly<T, K extends keyof T> = (<G>() => G extends {
    [P in K]: T[P];
} ? 1 : 2) extends (<G>() => G extends {
    readonly [P in K]: T[P];
} ? 1 : 2) ? true : false;
export type AddFunctionType<Name extends string, Args extends unknown[], ReturnType> = {
    [K in Name]: (...args: Args) => Promise<ReturnType>;
};
export type AddObservableFunctionType<Name extends string, Args extends unknown[], ReturnType> = {
    [K in Name]: (...args: Args) => Observable<ReturnType>;
};
export type AddPromiseFunctionType<Name extends string, Args extends unknown[], ReturnType> = {
    [K in Name]: (...args: Args) => Promise<ReturnType>;
};
//# sourceMappingURL=model.d.ts.map