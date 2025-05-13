import { Observable } from "rxjs";
import type { AnyFn, MessageTarget } from "./model.js";
export declare function promise<TMessage, TResponse>(target: MessageTarget, message: TMessage, abortSignal?: AbortSignal): Promise<TResponse>;
export declare function observable<TMessage, TResponse>(target: MessageTarget, message?: TMessage): Observable<TResponse>;
export type Client<T> = {
    [K in keyof T as T[K] extends (...args: unknown[]) => Observable<unknown> ? (K extends `${string}$` ? K : `${Extract<K, string>}$`) : K]: T[K] extends (...args: infer A) => Observable<infer R> ? (...args: A) => Observable<R> : T[K] extends (...args: infer A) => Promise<infer R> ? (...args: A) => Promise<R> : never;
};
export declare function client<T extends Record<string, AnyFn>>(target: MessageTarget): Client<T>;
//# sourceMappingURL=client.d.ts.map