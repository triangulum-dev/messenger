"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = void 0;
const messages_js_1 = require("../messages.js");
const utils_js_1 = require("../utils.js");
class Connection {
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
        const message = (0, messages_js_1.connectMessage)(id);
        target.postMessage(message, [channel.port2]);
        return new Connection(id, channel.port1);
    }
    static listen(id, source, onConnect) {
        const onmessage = (event) => {
            if (event.data.type === messages_js_1.MessageType.Connect &&
                event.data.id === id) {
                const port = event.ports[0];
                const connection = new Connection(id, port);
                onConnect(connection);
            }
        };
        (0, utils_js_1.addMessageEventListener)(source, onmessage);
        return {
            destroy: () => {
                source.removeEventListener("message", onmessage);
            },
        };
    }
}
exports.Connection = Connection;
