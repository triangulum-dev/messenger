import { expect } from "@std/expect/expect";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { spy, Stub, stub } from "@std/testing/mock";
import { Observable } from "rxjs";
import {
  ControllerBuilder,
  observableHandler,
  promiseHandler,
} from "./controller-builder.ts";
import {
  completeMessage,
  emitMessage,
  errorMessage,
  functionCallMessage,
  promiseMessage,
  rejectMessage,
  resolveMessage,
  subscribeMessage,
} from "./messages.ts";
import { releaseMicrotask } from "./utils.ts";
import { observableFunctionCallMessage } from "./index.ts";

describe("ControllerBuilder", () => {
  let clientPort: MessagePort;
  let controllerPort: MessagePort;

  beforeEach(() => {
    const channel = new MessageChannel();
    clientPort = channel.port1;
    controllerPort = channel.port2;
  });

  afterEach(() => {
    clientPort.close();
    controllerPort.close();
  });

  it("should build a controller with a promise handler and resolve", async () => {
    const builder = new ControllerBuilder(controllerPort)
      .add(
        "foo",
        promiseHandler((msg: string) => Promise.resolve(msg + "-ok")),
      );
    const controller = builder.build();
    controller.start();
    let received: unknown;
    clientPort.onmessage = (event: MessageEvent) => {
      received = event.data;
    };
    clientPort.postMessage(
      promiseMessage(1, functionCallMessage("foo", ["bar"])),
    );
    await releaseMicrotask();
    expect(received).toEqual(resolveMessage(1, "bar-ok"));
  });

  it("should build a controller with a promise handler and reject", async () => {
    const error = new Error("fail");
    const builder = new ControllerBuilder(controllerPort)
      .add("foo", promiseHandler(() => Promise.reject(error)));
    const controller = builder.build();
    controller.start();
    let received: unknown;
    clientPort.onmessage = (event: MessageEvent) => {
      received = event.data;
    };
    clientPort.postMessage(promiseMessage(2, functionCallMessage("foo", [])));
    await releaseMicrotask();
    expect(received).toEqual(rejectMessage(2, error));
  });

  it("should build a controller with an observable handler and emit/complete", async () => {
    const builder = new ControllerBuilder(controllerPort)
      .add(
        "stream",
        observableHandler((n: number) =>
          new Observable<string>((subscriber) => {
            subscriber.next("v" + n);
            subscriber.next("w" + n);
            subscriber.complete();
          })
        ),
      );
    const controller = builder.build();
    controller.start();
    const received: unknown[] = [];
    clientPort.onmessage = (event: MessageEvent) => {
      received.push(event.data);
    };
    const id = 1;
    clientPort.postMessage(
      subscribeMessage(id, observableFunctionCallMessage("stream", [7])),
    );
    await releaseMicrotask();
    expect(received).toEqual([
      emitMessage(id, "v7"),
      emitMessage(id, "w7"),
      completeMessage(id),
    ]);
  });

  it("should build a controller with an observable handler and error", async () => {
    const error = new Error("obs error");
    const builder = new ControllerBuilder(controllerPort)
      .add(
        "stream",
        observableHandler(() =>
          new Observable((subscriber) => {
            subscriber.error(error);
          })
        ),
      );
    const controller = builder.build();
    controller.start();
    let received: unknown;
    clientPort.onmessage = (event: MessageEvent) => {
      received = event.data;
    };
    clientPort.postMessage(
      subscribeMessage(4, observableFunctionCallMessage("stream", ["x"])),
    );
    await releaseMicrotask();
    expect(received).toEqual(errorMessage(4, error));
  });

  it("should allow chaining multiple add calls and build a composite controller", async () => {
    const builder = new ControllerBuilder(controllerPort)
      .add("foo", promiseHandler((n: number) => Promise.resolve(n + 1)))
      .add(
        "bar",
        observableHandler(() =>
          new Observable((subscriber) => {
            subscriber.next(10);
            subscriber.next(20);
            subscriber.complete();
          })
        ),
      );
    const controller = builder.build();
    controller.start();
    // Test promise
    let receivedPromise: unknown;
    clientPort.onmessage = (event: MessageEvent) => {
      receivedPromise = event.data;
    };
    clientPort.postMessage(promiseMessage(5, functionCallMessage("foo", [41])));
    await releaseMicrotask();
    expect(receivedPromise).toEqual(resolveMessage(5, 42));
    // Test observable
    const receivedObs: unknown[] = [];
    clientPort.onmessage = (event: MessageEvent) => {
      receivedObs.push(event.data);
    };
    clientPort.postMessage(
      subscribeMessage(6, observableFunctionCallMessage("bar", [null])),
    );
    await releaseMicrotask();
    expect(receivedObs).toEqual([
      emitMessage(6, 10),
      emitMessage(6, 20),
      completeMessage(6),
    ]);
  });

  it("should throw if build is called twice", () => {
    const builder = new ControllerBuilder(controllerPort).add(
      "foo",
      promiseHandler(() => Promise.resolve()),
    );
    builder.build();
    expect(() => builder.build()).toThrow();
  });

  it("should throw for unknown promise/observable function", async () => {
    const builder = new ControllerBuilder(controllerPort);
    const controller = builder.build();
    controller.start();
    let received: unknown;
    clientPort.onmessage = (event: MessageEvent) => {
      received = event.data;
    };
    // Unknown promise function
    clientPort.postMessage(promiseMessage(7, functionCallMessage("nope", [])));
    await releaseMicrotask();
    expect(received).toEqual(
      rejectMessage(7, new Error("Unknown promise function: nope")),
    );
    // Unknown observable function
    clientPort.onmessage = (event: MessageEvent) => {
      received = event.data;
    };
    clientPort.postMessage(
      subscribeMessage(8, observableFunctionCallMessage("nope", [])),
    );
    await releaseMicrotask();
    expect(received).toEqual(
      errorMessage(8, new Error("Unknown observable function: nope")),
    );
  });
});
