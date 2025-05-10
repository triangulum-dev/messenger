import type { Observable } from "rxjs";
import type { AddObservableFunctionType, AddPromiseFunctionType, MessageSource } from "./model.js";
export declare class ControllerBuilder<T extends object = object> {
    #private;
    constructor();
    addPromiseFunctionHandler<Name extends string, Args extends unknown[], ReturnType>(name: Name, handler: (...args: Args) => Promise<ReturnType>): ControllerBuilder<T & AddPromiseFunctionType<Name, Args, ReturnType>>;
    addObservableFunctionHandler<Name extends string, Args extends unknown[], ReturnType>(name: Name, handler: (...args: Args) => Observable<ReturnType>): ControllerBuilder<T & AddObservableFunctionType<Name, Args, ReturnType>>;
    build(id: string, source: MessageSource): T;
}
//# sourceMappingURL=controller-builder.d.ts.map