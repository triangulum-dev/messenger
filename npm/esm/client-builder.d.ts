import type { AddFunctionType, AddObservableFunctionType, MessageSource, MessageTarget } from "./model.js";
export declare class ClientBuilder<T extends object = object> {
    #private;
    readonly id: string;
    readonly target: MessageTarget & MessageSource;
    constructor(id: string, target: MessageTarget & MessageSource);
    addPromiseFunction<Args extends unknown[], ReturnType, Name extends string>(name: Name): ClientBuilder<T & AddFunctionType<Name, Args, ReturnType>>;
    addObservableFunction<Args extends unknown[], ReturnType, Name extends string>(name: Name): ClientBuilder<T & AddObservableFunctionType<Name, Args, ReturnType>>;
    build(): T;
}
//# sourceMappingURL=client-builder.d.ts.map