import { expect } from "@std/expect/expect";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import type { Stub } from "@std/testing/mock";
import { stub } from "@std/testing/mock";
import { assertRejects } from "jsr:@std/assert@^1.0.12/rejects";
import { Client } from "./client.ts";
import {
  completeMessage,
  emitMessage,
  errorMessage,
  promiseMessage,
  rejectMessage,
  resolveMessage,
  subscribeMessage,
} from "./messages.ts";
import { UUID } from "./utils.ts";

describe("Client", () => {
  let client: Client;
  let controllerPort: MessagePort;
  let clientPort: MessagePort;
  let uuidStub: Stub;
  const messageId =
    "a-b-c-d-e" as `${string}-${string}-${string}-${string}-${string}`;

  beforeEach(() => {
    const channel = new MessageChannel();
    clientPort = channel.port1;
    controllerPort = channel.port2;
    client = new Client(clientPort);
    uuidStub = stub(UUID, "create", () => messageId);
  });

  afterEach(() => {
    clientPort.close();
    controllerPort.close();
    uuidStub?.restore();
  });

  it("should send a promise message and resolve the result", async () => {
    const message = "test message";
    controllerPort.onmessage = (event: MessageEvent) => {
      expect(event.data).toEqual(promiseMessage(messageId, message));
      controllerPort.postMessage(resolveMessage(messageId, "response"));
    };
    const result = await client.promise<string, string>(message);
    expect(result).toBe("response");
  });

  it("should send a promise message and reject on error", () => {
    const message = "fail message";
    const error = new Error("fail");
    controllerPort.onmessage = (event: MessageEvent) => {
      expect(event.data).toEqual(promiseMessage(messageId, message));
      controllerPort.postMessage(rejectMessage(messageId, error));
    };
    assertRejects(() => client.promise<string, string>(message));
  });

  it("should send an observable message and emit values", async () => {
    const message = "obs test";
    controllerPort.onmessage = (event: MessageEvent) => {
      expect(event.data).toEqual(subscribeMessage(messageId, message));
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
    const message = "obs error";
    const error = new Error("observable error");
    controllerPort.onmessage = (event: MessageEvent) => {
      expect(event.data).toEqual(subscribeMessage(messageId, message));
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
});
