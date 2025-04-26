import type { ConnectMessage } from "./messages.ts";
import { MessageType } from "./messages.ts";
import type { ListenRef, MessageSource, MessageTarget } from "./model.ts";

export class ChannelConnection {
  static connect(
    id: string,
    target: MessageTarget<unknown>,
    targetOrigin: string,
  ): MessagePort {
    const channel = new MessageChannel();
    const message: ConnectMessage = {
      type: MessageType.Connect,
      port: channel.port2,
      id,
    };
    target.postMessage(message, targetOrigin, [message.port]);
    return channel.port1;
  }

  static listen(
    id: string,
    source: MessageSource<ConnectMessage>,
    sourceOrigin: string,
    onConnect: (messenger: MessagePort) => void,
  ): ListenRef {
    const onmessage = (event: MessageEvent) => {
      if (event.origin !== sourceOrigin) return;
      if (
        event.data.type === MessageType.Connect &&
        event.data.id === id
      ) {
        const message: ConnectMessage = event.data;
        onConnect(message.port);
      }
    };
    source.addEventListener("message", onmessage);
    return {
      destroy: () => {
        source.removeEventListener("message", onmessage);
      },
    };
  }
}
