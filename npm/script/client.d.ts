import { Observable } from "rxjs";
import type { MessageSource, MessageTarget } from "./model.js";
export declare class Client {
    #private;
    readonly id: string;
    readonly target: MessageTarget & MessageSource;
    constructor(id: string, target: MessageTarget & MessageSource);
    promise<TMessage, TResponse>(message: TMessage, abortSignal?: AbortSignal): Promise<TResponse>;
    observable<TMessage, TResponse>(message?: TMessage): Observable<TResponse>;
    close(): void;
}
//# sourceMappingURL=client.d.ts.map