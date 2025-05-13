import { expect } from "@std/expect/expect";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import type { Stub } from "@std/testing/mock";
import { stub } from "@std/testing/mock";
import { assertRejects } from "jsr:@std/assert@^1.0.12/rejects";
import { client, observable, promise } from "./client.ts";
import type { Observable } from "rxjs";
import {
  completeMessage,
  emitMessage,
  errorMessage,
  functionCallMessage,
  observableFunctionCallMessage,
  promiseMessage,
  rejectMessage,
  resolveMessage,
  subscribeMessage,
} from "./messages.ts";
import { UUID } from "./utils.ts";

describe("promise", () => {
  let controllerPort: MessagePort;
  let clientPort: MessagePort;
  let uuidStub: Stub;
  const messageId =
    "a-b-c-d-e" as `${string}-${string}-${string}-${string}-${string}`;

  beforeEach(() => {
    const channel = new MessageChannel();
    clientPort = channel.port1;
    controllerPort = channel.port2;
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
    const result = await promise<string, string>(clientPort, message);
    expect(result).toBe("response");
  });

  it("should send a promise message and reject on error", () => {
    const message = "fail message";
    const error = new Error("fail");
    controllerPort.onmessage = (event: MessageEvent) => {
      expect(event.data).toEqual(promiseMessage(messageId, message));
      controllerPort.postMessage(rejectMessage(messageId, error));
    };
    assertRejects(() => promise<string, string>(clientPort, message));
  });
});

describe("observable", () => {
  let controllerPort: MessagePort;
  let clientPort: MessagePort;
  let uuidStub: Stub;
  const messageId =
    "a-b-c-d-e" as `${string}-${string}-${string}-${string}-${string}`;

  beforeEach(() => {
    const channel = new MessageChannel();
    clientPort = channel.port1;
    controllerPort = channel.port2;
    uuidStub = stub(UUID, "create", () => messageId);
  });

  afterEach(() => {
    clientPort.close();
    controllerPort.close();
    uuidStub?.restore();
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
      observable<string, string>(clientPort, message).subscribe({
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
      observable<string, string>(clientPort, message).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          resolve();
        },
      });
    });
  });
});

type TestService = {
  foo: (arg1: string, arg2: number) => Promise<string>;
  bar$: () => Observable<number>;
  stream$: (id: string) => Observable<string>;
};

describe("client", () => {
  let controllerPort: MessagePort;
  let clientPort: MessagePort;
  let uuidStub: Stub;
  const messageId =
    "a-b-c-d-e" as `${string}-${string}-${string}-${string}-${string}`;

  beforeEach(() => {
    const channel = new MessageChannel();
    clientPort = channel.port1;
    controllerPort = channel.port2;
    uuidStub = stub(UUID, "create", () => messageId);
  });

  afterEach(() => {
    clientPort.close();
    controllerPort.close();
    uuidStub?.restore();
  });

  it("should call a promise method via proxy", async () => {
    controllerPort.onmessage = (event: MessageEvent) => {
      expect(event.data.data).toEqual(
        functionCallMessage("foo", ["hello", 42]),
      );
      controllerPort.postMessage(resolveMessage(messageId, "world"));
    };
    const testClient = client<TestService>(clientPort);
    const result = await testClient.foo(
      "hello",
      42,
    );
    expect(result).toBe("world");
  });

  it("should call an observable method via proxy (ending with $)", async () => {
    controllerPort.onmessage = (event: MessageEvent) => {
      expect(event.data.data).toEqual(
        observableFunctionCallMessage("bar", []),
      );
      controllerPort.postMessage(emitMessage(messageId, 1));
      controllerPort.postMessage(emitMessage(messageId, 2));
      controllerPort.postMessage(completeMessage(messageId));
    };
    const testClient = client<TestService>(clientPort);
    const received: number[] = [];
    await new Promise<void>((resolve) => {
      testClient.bar$().subscribe({
        next: (v: number) => received.push(v),
        complete: () => {
          expect(received).toEqual([1, 2]);
          resolve();
        },
      });
    });
  });

  it("should call an observable method with args via proxy (ending with $)", async () => {
    controllerPort.onmessage = (event: MessageEvent) => {
      expect(event.data.data).toEqual(
        observableFunctionCallMessage("stream", ["abc"]),
      );
      controllerPort.postMessage(emitMessage(messageId, "x"));
      controllerPort.postMessage(emitMessage(messageId, "y"));
      controllerPort.postMessage(completeMessage(messageId));
    };
    const testClient = client<TestService>(clientPort);
    const received: string[] = [];
    await new Promise<void>((resolve) => {
      testClient.stream$("abc")
        .subscribe(
          {
            next: (v: string) => received.push(v),
            complete: () => {
              expect(received).toEqual(["x", "y"]);
              resolve();
            },
          },
        );
    });
  });
});
