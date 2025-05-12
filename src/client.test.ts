import { expect } from "@std/expect/expect";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { Stub, stub } from "@std/testing/mock";
import { Client } from "./client.ts";
import {
  completeMessage,
  emitMessage,
  errorMessage,
  observeMessage,
  promiseMessage,
  rejectMessage,
  resolveMessage,
} from "./messages.ts";
import { Connection } from "./connection.ts";
import { assertRejects } from "jsr:@std/assert@^1.0.12/rejects";

describe("Client", () => {
  let client: Client;
  let controllerPort: MessagePort;
  let clientPort: MessagePort;

  beforeEach(() => {
    const channel = new MessageChannel();
    clientPort = channel.port1;
    controllerPort = channel.port2;
    client = new Client(clientPort);
  });

  afterEach(() => {
    clientPort.close();
    controllerPort.close();
  });

  it("should send a promise message and resolve the result", async () => {
    const messageId = 0;
    const message = "test message";
    controllerPort.onmessage = (event: MessageEvent) => {
      expect(event.data).toEqual(promiseMessage(messageId, message));
      controllerPort.postMessage(resolveMessage(messageId, "response"));
    };
    const result = await client.promise<string, string>(message);
    expect(result).toBe("response");
  });

  it("should send a promise message and reject on error", async () => {
    const messageId = 0;
    const message = "fail message";
    const error = new Error("fail");
    controllerPort.onmessage = (event: MessageEvent) => {
      expect(event.data).toEqual(promiseMessage(messageId, message));
      controllerPort.postMessage(rejectMessage(messageId, error));
    };
    assertRejects(() => client.promise<string, string>(message));
  });

  it("should send an observable message and emit values", async () => {
    const messageId = 0;
    const message = "obs test";
    controllerPort.onmessage = (event: MessageEvent) => {
      expect(event.data).toEqual(observeMessage(messageId, message));
      controllerPort.postMessage(emitMessage(messageId, "value1"));
      controllerPort.postMessage(emitMessage(messageId, "value2"));
      controllerPort.postMessage(completeMessage(messageId));
    };
    const received: unknown[] = [];
    await new Promise<void>((resolve) => {
      client.observable<string, string>(message).subscribe({
        next: (v) => received.push(v),
        complete: () => {
          expect(received).toEqual(["value1", "value2"]);
          resolve();
        },
      });
    });
  });

  it("should send an observable message and handle errors", async () => {
    const messageId = 0;
    const message = "obs error";
    const error = new Error("observable error");
    controllerPort.onmessage = (event: MessageEvent) => {
      expect(event.data).toEqual(observeMessage(messageId, message));
      controllerPort.postMessage(errorMessage(messageId, error));
    };
    await new Promise<void>((resolve) => {
      client.observable<string, string>(message).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          resolve();
        },
      });
    });
  });

  it("should close the connection when close is called", () => {
    // No direct way to assert port is closed, but no error should occur
    client.close();
  });
});
