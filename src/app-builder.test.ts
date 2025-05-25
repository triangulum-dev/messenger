import { expect } from "@std/expect/expect";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import type { spy as _spy, Stub as _Stub, stub as _stub } from "@std/testing/mock";
import { Observable } from "rxjs";
import {
  AppBuilder,
} from "./app-builder.ts";
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

describe("AppBuilder", () => {
  let clientPort: MessagePort;
  let appPort: MessagePort;

  beforeEach(() => {
    const channel = new MessageChannel();
    clientPort = channel.port1;
    appPort = channel.port2;
  });

  afterEach(() => {
    clientPort.close();
    appPort.close();
  });

  it("should build an app context with a promise handler and resolve", async () => {
    const builder = new AppBuilder(appPort)
      .mapPromise(
        "foo",
        (...args: unknown[]) => Promise.resolve((args[0] as string) + "-ok"),
      );
    const appContext = builder.build();
    appContext.start();
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

  it("should build an app context with a promise handler and reject", async () => {
    const error = new Error("fail");
    const builder = new AppBuilder(appPort)
      .mapPromise("foo", () => Promise.reject(error));
    const appContext = builder.build();
    appContext.start();
    let received: unknown;
    clientPort.onmessage = (event: MessageEvent) => {
      received = event.data;
    };
    clientPort.postMessage(promiseMessage(2, functionCallMessage("foo", [])));
    await releaseMicrotask();
    expect(received).toEqual(rejectMessage(2, error));
  });

  it("should build an app context with an observable handler and emit/complete", async () => {
    const builder = new AppBuilder(appPort)
      .mapObservable(
        "stream",
        (n: number) =>
          new Observable<string>((subscriber) => {
            subscriber.next("v" + n);
            subscriber.next("w" + n);
            subscriber.complete();
          }),
      );
    const appContext = builder.build();
    appContext.start();
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

  it("should build an app context with an observable handler and error", async () => {
    const error = new Error("obs error");
    const builder = new AppBuilder(appPort)
      .mapObservable(
        "stream",
        () =>
          new Observable((subscriber) => {
            subscriber.error(error);
          }),
      );
    const appContext = builder.build();
    appContext.start();
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

  it("should allow chaining multiple add calls and build a composite app context", async () => {
    const builder = new AppBuilder(appPort)
      .mapPromise("foo", (...args: unknown[]) => Promise.resolve((args[0] as number) + 1))
      .mapObservable(
        "bar",
        () =>
          new Observable((subscriber) => {
            subscriber.next(10);
            subscriber.next(20);
            subscriber.complete();
          }),
      );
    const appContext = builder.build();
    appContext.start();
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
    const builder = new AppBuilder(appPort).mapPromise(
      "foo",
      () => Promise.resolve(),
    );
    builder.build();
    expect(() => builder.build()).toThrow();
  });

  it("should throw for unknown promise/observable function", async () => {
    const builder = new AppBuilder(appPort);
    const appContext = builder.build();
    appContext.start();
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
