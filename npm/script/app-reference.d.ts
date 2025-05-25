import type { Observable } from "rxjs";
import type { AppContext } from "./app-context.js";
export declare class AppReference {
    #private;
    constructor(appContext: AppContext, promiseHandlers: Record<string, (...args: unknown[]) => Promise<unknown>>, observableHandlers: Record<string, (...args: unknown[]) => Observable<unknown>>);
    run(): void;
}
//# sourceMappingURL=app-reference.d.ts.map