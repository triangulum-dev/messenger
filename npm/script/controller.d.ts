import type { Observable } from "rxjs";
import type { MessageSource } from "./model.js";
export declare class Controller {
    #private;
    readonly id: string;
    readonly source: MessageSource;
    constructor(id: string, source: MessageSource);
    onPromise(handler: (data: unknown) => Promise<unknown>): void;
    onObservable(handler: (data: unknown) => Observable<unknown>): void;
    close(): void;
}
//# sourceMappingURL=controller.d.ts.map