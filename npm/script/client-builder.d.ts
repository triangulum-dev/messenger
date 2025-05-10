import type { AddFunctionType, AddObservableFunctionType, MessageSource, MessageTarget } from "./model.js";
export declare class ClientBuilder<T extends object = object> {
    #private;
    readonly id: string;
    readonly target: MessageTarget & MessageSource;
    constructor(id: string, target: MessageTarget & MessageSource);
    addPromiseFunction<Name extends string, Args extends unknown[], ReturnType>(name: Name): ClientBuilder<T & AddFunctionType<Name, Args, ReturnType>>;
    addObservableFunction<Name extends string, Args extends unknown[], ReturnType>(name: Name): ClientBuilder<T & AddObservableFunctionType<Name, Args, ReturnType>>;
    build(): T;
}
//# sourceMappingURL=client-builder.d.ts.map