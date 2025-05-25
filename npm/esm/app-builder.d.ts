import type { Observable } from "rxjs";
import type { MessageTarget } from "./model.js";
import { AppReference } from "./app-reference.js";
export declare class AppBuilder {
    #private;
    readonly target: MessageTarget;
    constructor(target: MessageTarget);
    mapPromise<Name extends string, Args extends unknown[], Ret>(name: Name, handler: (...args: Args) => Promise<Ret>): AppBuilder;
    mapObservable<Name extends string, Args extends unknown[], Ret>(name: Name, handler: (...args: Args) => Observable<Ret>): AppBuilder;
    addController(controllerInstance: object): AppBuilder;
    build(): AppReference;
}
//# sourceMappingURL=app-builder.d.ts.map