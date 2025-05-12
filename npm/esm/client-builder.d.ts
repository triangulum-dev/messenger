import type { AddFunctionType, AddObservableFunctionType, MessageTarget } from "./model.js";
export type PromiseFunctionDef<Args extends unknown[], ReturnType> = {
    type: "promise";
    _phantom?: [Args, ReturnType];
};
export type ObservableFunctionDef<Args extends unknown[], ReturnType> = {
    type: "observable";
    _phantom?: [Args, ReturnType];
};
export type FunctionDef<Args extends unknown[], ReturnType> = PromiseFunctionDef<Args, ReturnType> | ObservableFunctionDef<Args, ReturnType>;
export type ExtractArgs<T extends FunctionDef<unknown[], unknown>> = T extends FunctionDef<infer Args, unknown> ? Args : never;
export type ExtractReturnType<T extends FunctionDef<unknown[], unknown>> = T extends FunctionDef<unknown[], infer ReturnType> ? ReturnType : never;
export declare function promiseFunction<Args extends unknown[], ReturnType>(): PromiseFunctionDef<Args, ReturnType>;
export declare function observableFunction<Args extends unknown[], ReturnType>(): ObservableFunctionDef<Args, ReturnType>;
export declare class ClientBuilder<T extends object = object> {
    #private;
    readonly id: string;
    readonly target: MessageTarget;
    constructor(id: string, target: MessageTarget);
    add<Name extends string, Def extends FunctionDef<unknown[], unknown>>(name: Name, definition: Def): ClientBuilder<T & (Def extends {
        type: "promise";
    } ? AddFunctionType<Name, ExtractArgs<Def>, ExtractReturnType<Def>> : AddObservableFunctionType<Name, ExtractArgs<Def>, ExtractReturnType<Def>>)>;
    build(): T;
}
//# sourceMappingURL=client-builder.d.ts.map