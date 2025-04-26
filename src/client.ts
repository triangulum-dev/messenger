import { ChannelConnection } from "./channel-connection.ts";
import type { MessageTarget } from "./model.ts";
import { Messenger } from "./messenger.ts";

export class MessengerClient {
  #asyncMessenger: Messenger;

  constructor(
    readonly id: string,
    readonly target: MessageTarget,
    readonly targetOrigin: string,
  ) {
    const channelConnection = ChannelConnection.connect(
      this.id,
      this.target,
      this.targetOrigin,
    );
    this.#asyncMessenger = new Messenger(channelConnection);
  }

  send<TMessage, TResponse>(
    id: string,
    message: TMessage,
  ): Promise<TResponse> {
    return this.#asyncMessenger.send(id, message);
  }
}
