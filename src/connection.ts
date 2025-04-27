import type { ConnectMessage } from "./messages.ts";
import { connectMessage, MessageType } from "./messages.ts";
import type { ListenRef, MessageSource, MessageTarget } from "./model.ts";
import { addMessageEventListener } from "./utils.ts";

export class Connection {
  static connect(
    id: string,
    target: MessageTarget<unknown>,
  ): MessagePort {
    const channel = new MessageChannel();
    const message: ConnectMessage = connectMessage(id);
    target.postMessage(message, [channel.port2]);
    return channel.port1;
  }

  static listen(
    id: string,
    source: MessageSource<ConnectMessage>,
    onConnect: (messenger: MessagePort) => void,
  ): ListenRef {
    const onmessage = (event: MessageEvent) => {
      if (
        event.data.type === MessageType.Connect &&
        event.data.id === id
      ) {
        const port = event.ports[0];
        onConnect(port);
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
