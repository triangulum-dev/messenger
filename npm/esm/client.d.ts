import { Observable } from "rxjs";
import type { MessageTarget } from "./model.js";
export declare class Client {
    #private;
    readonly target: MessageTarget;
    constructor(target: MessageTarget);
    promise<TMessage, TResponse>(message: TMessage, abortSignal?: AbortSignal): Promise<TResponse>;
    observable<TMessage, TResponse>(message?: TMessage): Observable<TResponse>;
    close(): void;
}
//# sourceMappingURL=client.d.ts.map