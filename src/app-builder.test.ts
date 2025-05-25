import { expect } from "@std/expect/expect";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import {
  spy,
  type spy as _spy,
  type Stub as _Stub,
  type stub as _stub,
} from "@std/testing/mock";
import { Observable } from "rxjs";
import { AppBuilder } from "./app-builder.ts";
import { Controller, GetObservable, GetPromise } from "./controller.ts";
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

  it("should build an app with a promise handler and resolve", async () => {
    const builder = new AppBuilder(appPort);
    builder.mapPromise(
      "foo",
      (...args: unknown[]) => Promise.resolve((args[0] as string) + "-ok"),
    );
    const appRef = builder.build();
    appRef.run();
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

  it("should build an app with a promise handler and reject", async () => {
    const error = new Error("fail");
    const builder = new AppBuilder(appPort)
      .mapPromise("foo", () => Promise.reject(error));
    const appRef = builder.build();
    appRef.run();
    let received: unknown;
    clientPort.onmessage = (event: MessageEvent) => {
      received = event.data;
    };
    clientPort.postMessage(promiseMessage(2, functionCallMessage("foo", [])));
    await releaseMicrotask();
    expect(received).toEqual(rejectMessage(2, error));
  });

  it("should build an app with an observable handler and emit/complete", async () => {
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
    const appRef = builder.build();
    appRef.run();
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

  it("should build an app with an observable handler and error", async () => {
    const error = new Error("obs error");
    const builder = new AppBuilder(appPort)
      .mapObservable(
        "stream",
        () =>
          new Observable((subscriber) => {
            subscriber.error(error);
          }),
      );
    const appRef = builder.build();
    appRef.run();
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

  it("should allow chaining multiple add calls and build a composite app", async () => {
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
    const appRef = builder.build();
    appRef.run();
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
    const appRef = builder.build();
    appRef.run();
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

  describe("addController", () => {
    @Controller({ name: "myClass" })
    class MyTestController {
      @GetPromise()
      myPromise(val: number): Promise<number> {
        return Promise.resolve(val + 1);
      }

      @GetObservable()
      myObservable(val: string): Observable<string> {
        return new Observable((subscriber) => {
          subscriber.next(val + "-obs1");
          subscriber.next(val + "-obs2");
          subscriber.complete();
        });
      }

      // Not decorated, should be ignored
      ignoredMethod() {
        return "ignored";
      }
    }

    it("should add methods from a controller class and map them correctly", async () => {
      const controller = new MyTestController();
      const builder = new AppBuilder(appPort).addController(controller);
      const appRef = builder.build(); // Renamed to appRef
      appRef.run(); // Called start on appContext

      // Test promise method
      let receivedPromise: unknown;
      clientPort.onmessage = (event: MessageEvent) => {
        receivedPromise = event.data;
      };
      clientPort.postMessage(
        promiseMessage(10, functionCallMessage("myClass.myPromise", [99])),
      );
      await releaseMicrotask();
      expect(receivedPromise).toEqual(resolveMessage(10, 100));

      // Test observable method
      const receivedObs: unknown[] = [];
      clientPort.onmessage = (event: MessageEvent) => {
        receivedObs.push(event.data);
      };
      clientPort.postMessage(
        subscribeMessage(
          11,
          observableFunctionCallMessage("myClass.myObservable", ["test"]),
        ),
      );
      await releaseMicrotask();
      expect(receivedObs).toEqual([
        emitMessage(11, "test-obs1"),
        emitMessage(11, "test-obs2"),
        completeMessage(11),
      ]);
    });

    it("should handle controller with no name", async () => {
      @Controller({})
      class NoNameController {
        @GetPromise()
        simplePromise() {
          return Promise.resolve("simple");
        }
      }
      const controller = new NoNameController();
      const builder = new AppBuilder(appPort).addController(controller);
      const appRef = builder.build();
      appRef.run();

      let received: unknown;
      clientPort.onmessage = (event: MessageEvent) => {
        received = event.data;
      };
      clientPort.postMessage(
        promiseMessage(12, functionCallMessage("simplePromise", [])),
      );
      await releaseMicrotask();
      expect(received).toEqual(resolveMessage(12, "simple"));
    });
  });
});
