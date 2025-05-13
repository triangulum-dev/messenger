import type { ListenRef, MessageTarget } from "../model.js";
export declare class Connection {
    readonly id: string;
    readonly port: MessagePort;
    constructor(id: string, port: MessagePort);
    static create(id: string, target: MessageTarget): Connection;
    static listen(id: string, source: MessageTarget, onConnect: (messenger: Connection) => void): ListenRef;
}
//# sourceMappingURL=connection.d.ts.map