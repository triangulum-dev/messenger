import type { Observable } from "rxjs";
import type { MessageTarget } from "./model.js";
export declare class AppContext {
    #private;
    readonly target: MessageTarget;
    constructor(target: MessageTarget);
    start(): void;
    onPromise(handler: (data: unknown, abortSignal: AbortSignal) => Promise<unknown>): void;
    onObservable(handler: (data: unknown) => Observable<unknown>): void;
    close(): void;
}
//# sourceMappingURL=app-context.d.ts.map