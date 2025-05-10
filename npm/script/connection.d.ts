import type { ConnectMessage } from "./messages.js";
import type { ListenRef, MessageSource, MessageTarget } from "./model.js";
export declare class Connection {
    readonly id: string;
    readonly port: MessagePort;
    constructor(id: string, port: MessagePort);
    static create(id: string, target: MessageTarget<unknown>): Connection;
    static listen(id: string, source: MessageSource<ConnectMessage>, onConnect: (messenger: Connection) => void): ListenRef;
}
//# sourceMappingURL=connection.d.ts.map