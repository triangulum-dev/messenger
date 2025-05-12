import type { Observable } from "rxjs";
import type { MessageTarget } from "./model.js";
export declare class Controller {
    #private;
    readonly target: MessageTarget;
    constructor(target: MessageTarget);
    start(): void;
    onPromise(handler: (data: unknown) => Promise<unknown>): void;
    onObservable(handler: (data: unknown) => Observable<unknown>): void;
    close(): void;
}
//# sourceMappingURL=controller.d.ts.map