import { expect } from "@std/expect/expect";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { Stub, stub } from "@std/testing/mock";
import {
  ClientBuilder,
  observableFunction,
  promiseFunction,
} from "./client-builder.ts";
import {
  completeMessage,
  emitMessage,
  promiseMessage,
  resolveMessage,
  subscribeMessage,
} from "./messages.ts";
import { UUID } from "./utils.ts";

// Mocks for MessagePort
function createMessageChannel() {
  const channel = new MessageChannel();
  return { clientPort: channel.port1, controllerPort: channel.port2 };
}

describe("ClientBuilder", () => {
  let clientPort: MessagePort;
  let controllerPort: MessagePort;
  let uuidStub: Stub;
  const messageId =
    "a-b-c-d-e" as `${string}-${string}-${string}-${string}-${string}`;

  beforeEach(() => {
    const channel = createMessageChannel();
    clientPort = channel.clientPort;
    controllerPort = channel.controllerPort;
    uuidStub = stub(UUID, "create", () => messageId);
  });

  afterEach(() => {
    clientPort.close();
    controllerPort.close();
    uuidStub.restore();
  });

  it("should build a client with a promise function and resolve", async () => {
    const builder = new ClientBuilder(clientPort)
      .add("foo", promiseFunction<[string], string>());
    const client = builder.build();
    controllerPort.onmessage = (event: MessageEvent) => {
      expect(event.data).toEqual(promiseMessage(messageId, ["bar"]));
      controllerPort.postMessage(resolveMessage(messageId, "baz"));
    };
    const result = await (client as any).foo("bar");
    expect(result).toBe("baz");
  });

  it("should build a client with an observable function and emit/complete", async () => {
    const builder = new ClientBuilder(clientPort)
      .add("stream", observableFunction<[number], string>());
    const client = builder.build();
    controllerPort.onmessage = (event: MessageEvent) => {
      expect(event.data).toEqual(subscribeMessage(messageId, [42]));
      controllerPort.postMessage(emitMessage(messageId, "a"));
      controllerPort.postMessage(emitMessage(messageId, "b"));
      controllerPort.postMessage(completeMessage(messageId));
    };
    const received: string[] = [];
    await new Promise<void>((resolve) => {
      (client as any).stream(42).subscribe({
        next: (v: string) => received.push(v),
        complete: () => {
          expect(received).toEqual(["a", "b"]);
          resolve();
        },
      });
    });
  });

  it("should throw if build is called twice", () => {
    const builder = new ClientBuilder(clientPort).add(
      "foo",
      promiseFunction<[], void>(),
    );
    builder.build();
    try {
      builder.build();
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      return;
    }
    throw new Error("Expected an error to be thrown");
  });

  it("should allow chaining multiple add calls and build a composite client", async () => {
    const builder = new ClientBuilder(clientPort)
      .add("foo", promiseFunction<[number], string>())
      .add("bar", observableFunction<[], number>());
    const client = builder.build();
    // Test promise function
    controllerPort.onmessage = (event: MessageEvent) => {
      if (event.data.type === "promise") {
        controllerPort.postMessage(resolveMessage(messageId, "ok"));
      } else if (event.data.type === "observable") {
        controllerPort.postMessage(emitMessage(messageId, 1));
        controllerPort.postMessage(emitMessage(messageId, 2));
        controllerPort.postMessage(completeMessage(messageId));
      }
    };
    const promiseResult = await (client as any).foo(123);
    expect(promiseResult).toBe("ok");
    const obsReceived: number[] = [];
    await new Promise<void>((resolve) => {
      (client as any).bar().subscribe({
        next: (v: number) => obsReceived.push(v),
        complete: () => {
          expect(obsReceived).toEqual([1, 2]);
          resolve();
        },
      });
    });
  });
});
