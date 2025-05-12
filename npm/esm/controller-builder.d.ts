import type { Observable } from "rxjs";
import { Controller } from "./controller.js";
import type { AddObservableFunctionType, AddPromiseFunctionType, MessageTarget } from "./model.js";
export type PromiseHandlerDef<Args extends unknown[], ReturnType> = {
    type: "promise";
    handler: (...args: Args) => Promise<ReturnType>;
};
export type ObservableHandlerDef<Args extends unknown[], ReturnType> = {
    type: "observable";
    handler: (...args: Args) => Observable<ReturnType>;
};
export type HandlerDefUnion = PromiseHandlerDef<any[], any> | ObservableHandlerDef<any[], any>;
export type ExtractHandlerArgs<Def extends HandlerDefUnion> = Def extends PromiseHandlerDef<infer Args, unknown> ? Args : Def extends ObservableHandlerDef<infer Args, unknown> ? Args : never;
export type ExtractHandlerReturnType<Def extends HandlerDefUnion> = Def extends PromiseHandlerDef<unknown[], infer Ret> ? Ret : Def extends ObservableHandlerDef<unknown[], infer Ret> ? Ret : never;
export declare function promiseHandler<Args extends unknown[], ReturnType>(handler: (...args: Args) => Promise<ReturnType>): PromiseHandlerDef<Args, ReturnType>;
export declare function observableHandler<Args extends unknown[], ReturnType>(handler: (...args: Args) => Observable<ReturnType>): ObservableHandlerDef<Args, ReturnType>;
export declare class ControllerBuilder<T extends object = object> {
    #private;
    constructor();
    add<Name extends string, Def extends HandlerDefUnion>(name: Name, definition: Def): ControllerBuilder<T & (Def extends {
        type: "promise";
    } ? AddPromiseFunctionType<Name, ExtractHandlerArgs<Def>, ExtractHandlerReturnType<Def>> : AddObservableFunctionType<Name, ExtractHandlerArgs<Def>, ExtractHandlerReturnType<Def>>)>;
    build(id: string, target: MessageTarget): Controller;
}
//# sourceMappingURL=controller-builder.d.ts.map