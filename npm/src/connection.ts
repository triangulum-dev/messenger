import type { ConnectMessage } from "./messages.js";
import { connectMessage, MessageType } from "./messages.js";
import type { ListenRef, MessageTarget } from "./model.js";
import { addMessageEventListener } from "./utils.js";

export class Connection {
  constructor(readonly id: string, readonly port: MessagePort) {}

  static create(
    id: string,
    target: MessageTarget,
  ): Connection {
    const channel = new MessageChannel();
    const message: ConnectMessage = connectMessage(id);
    target.postMessage(message, [channel.port2]);
    return new Connection(id, channel.port1);
  }

  static listen(
    id: string,
    source: MessageTarget,
    onConnect: (messenger: Connection) => void,
  ): ListenRef {
    const onmessage = (event: MessageEvent) => {
      if (
        event.data.type === MessageType.Connect &&
        event.data.id === id
      ) {
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
