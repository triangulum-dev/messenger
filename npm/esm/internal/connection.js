import { connectMessage, MessageType } from "../messages.js";
import { addMessageEventListener } from "../utils.js";
export class Connection {
    constructor(id, port) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "port", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: port
        });
    }
    static create(id, target) {
        const channel = new MessageChannel();
        const message = connectMessage(id);
        target.postMessage(message, [channel.port2]);
        return new Connection(id, channel.port1);
    }
    static listen(id, source, onConnect) {
        const onmessage = (event) => {
            if (event.data.type === MessageType.Connect &&
                event.data.id === id) {
                const port = event.ports[0];
                const connection = new Connection(id, port);
                onConnect(connection);
            }
        };
        addMessageEventListener(source, onmessage);
        return {
            destroy: () => {
                source.removeEventListener("message", onmessage);
            },
        };
    }
}
