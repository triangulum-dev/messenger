import { expect } from "@std/expect/expect";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { assertSpyCall, assertSpyCallArg, spy, stub } from "@std/testing/mock";
import { Connection } from "./connection.ts";
import { Controller } from "./controller.ts";
import { promiseMessage, rejectMessage, resolveMessage, observeMessage, emitMessage, errorMessage, completeMessage } from "./messages.ts";
import { releaseMicrotask } from "./utils.ts";
import { Observable } from "rxjs";

describe("Controller", () => {
  let clientPort: MessagePort;
  let controllerPort: MessagePort;
  let onConnect: ((connection: Connection) => void) | undefined;
  let listenStub: { restore: () => void };

  beforeEach(() => {
    const channel = new MessageChannel();
    clientPort = channel.port1;
    controllerPort = channel.port2;
    onConnect = undefined;
    listenStub = stub(
      Connection,
      "listen",
      (_id, _source, onConnectCallback) => {
        onConnect = onConnectCallback;
        return {
          destroy: () => {},
        };
      },
    );
  });

  afterEach(() => {
    clientPort.close();
    controllerPort.close();
    listenStub.restore();
  });

  it("should listen for connections", () => {
    // Arrange
    const connectionId = "test-id";
    // Act
    new Controller(connectionId, controllerPort);
    // Assert
    // Use the stub's call arguments directly
    const stubCalls =
      (listenStub as unknown as { calls: { args: unknown[] }[] }).calls;
    expect(stubCalls[0].args[0]).toBe(connectionId);
    expect(stubCalls[0].args[1]).toBe(controllerPort);
  });

  it("should call the promise handler and resolve the result", async () => {
    // Arrange
    const connectionId = "test-id";
    const controller = new Controller(connectionId, controllerPort);
    const promiseHandler = spy(() => Promise.resolve("result"));
    const connection = new Connection(connectionId, controllerPort);
    onConnect!(connection);
    controller.onPromise(promiseHandler);
    const messageId = 3;
    const message = "test message";
    let recievedMessageEvent: MessageEvent;
    const listenerSpy = spy((event: MessageEvent) => {
      recievedMessageEvent = event;
    });
    clientPort.onmessage = listenerSpy;
    // Act
    clientPort.postMessage(promiseMessage(messageId, message));
    await releaseMicrotask();
    // Assert
    assertSpyCall(promiseHandler, 0);
    assertSpyCallArg(promiseHandler, 0, 0, message);
    assertSpyCall(listenerSpy, 0);
    expect(recievedMessageEvent!).toBeDefined();
    expect(recievedMessageEvent!.data).toEqual(
      resolveMessage(messageId, "result"),
    );
  });

  it("should call the promise handler and reject on error", async () => {
    // Arrange
    const connectionId = "test-id";
    const controller = new Controller(connectionId, controllerPort);
    const error = new Error("fail");
    const promiseHandler = spy(() => Promise.reject(error));
    const connection = new Connection(connectionId, controllerPort);
    onConnect!(connection);
    controller.onPromise(promiseHandler);
    const messageId = 7;
    const message = "bad message";
    let recievedMessageEvent: MessageEvent;
    const listenerSpy = spy((event: MessageEvent) => {
      recievedMessageEvent = event;
    });
    clientPort.onmessage = listenerSpy;
    // Act
    clientPort.postMessage(promiseMessage(messageId, message));
    await releaseMicrotask();
    // Assert
    assertSpyCall(promiseHandler, 0);
    assertSpyCallArg(promiseHandler, 0, 0, message);
    assertSpyCall(listenerSpy, 0);
    expect(recievedMessageEvent!).toBeDefined();
    expect(recievedMessageEvent!.data).toEqual(
      rejectMessage(messageId, error),
    )
  });

  it("should call the observable handler and emit values", async () => {
    // Arrange
    const connectionId = "test-id";
    const controller = new Controller(connectionId, controllerPort);
    const observableHandler = spy(() => new Observable<string>((subscriber) => {
      subscriber.next("value1");
      subscriber.next("value2");
    }));
    const connection = new Connection(connectionId, controllerPort);
    onConnect!(connection);
    controller.onObservable(observableHandler);
    const messageId = 10;
    const message = "emit test";
    const received: unknown[] = [];
    clientPort.onmessage = (event: MessageEvent) => {
      received.push(event.data);
    };
    // Act
    clientPort.postMessage(observeMessage(messageId, message));
    await releaseMicrotask();
    // Assert
    assertSpyCall(observableHandler, 0);
    assertSpyCallArg(observableHandler, 0, 0, message);
    expect(received.length).toBe(2);
    expect(received[0]).toEqual(emitMessage(messageId, "value1"));
    expect(received[1]).toEqual(emitMessage(messageId, "value2"));
  });

  it("should call the observable handler and handle errors", async () => {
    // Arrange
    const connectionId = "test-id";
    const controller = new Controller(connectionId, controllerPort);
    const error = new Error("observable error");
    const observableHandler = spy(() => new Observable<string>((subscriber) => {
      subscriber.error(error);
    }));
    const connection = new Connection(connectionId, controllerPort);
    onConnect!(connection);
    controller.onObservable(observableHandler);
    const messageId = 11;
    const message = "error test";
    let received: unknown;
    clientPort.onmessage = (event: MessageEvent) => {
      received = event.data;
    };
    // Act
    clientPort.postMessage(observeMessage(messageId, message));
    await releaseMicrotask();
    // Assert
    assertSpyCall(observableHandler, 0);
    assertSpyCallArg(observableHandler, 0, 0, message);
    expect(received).toEqual(errorMessage(messageId, error));
  });

  it("should call the observable handler and complete", async () => {
    // Arrange
    const connectionId = "test-id";
    const controller = new Controller(connectionId, controllerPort);
    const observableHandler = spy(() => new Observable<string>((subscriber) => {
      subscriber.complete();
    }));
    const connection = new Connection(connectionId, controllerPort);
    onConnect!(connection);
    controller.onObservable(observableHandler);
    const messageId = 12;
    const message = "complete test";
    let received: unknown;
    clientPort.onmessage = (event: MessageEvent) => {
      received = event.data;
    };
    // Act
    clientPort.postMessage(observeMessage(messageId, message));
    await releaseMicrotask();
    // Assert
    assertSpyCall(observableHandler, 0);
    assertSpyCallArg(observableHandler, 0, 0, message);
    expect(received).toEqual(completeMessage(messageId));
  });

  it("should close all connections when close is called", () => {
    // Arrange
    const connectionId = "test-id";
    const controller = new Controller(connectionId, controllerPort);
    const connection = new Connection(connectionId, controllerPort);
    onConnect!(connection);
    // Spy on port.close
    const closeSpy = spy(connection.port, "close");
    // Act
    controller.close();
    // Assert
    assertSpyCall(closeSpy, 0);
  });

  it("should ignore unknown message types", async () => {
    // Arrange
    const connectionId = "test-id";
    const controller = new Controller(connectionId, controllerPort);
    const connection = new Connection(connectionId, controllerPort);
    onConnect!(connection);
    // Spy on console.error
    const errorSpy = spy(console, "error");
    // Act
    clientPort.postMessage({ type: "unknown", id: 99, data: "foo" });
    await releaseMicrotask();
    // Assert
    assertSpyCall(errorSpy, 0);
    expect(errorSpy.calls[0].args[0]).toBe("Unknown message type:");
    expect(errorSpy.calls[0].args[1]).toBe("unknown");
    errorSpy.restore();
  });

  it("should error all active observables on close", async () => {
    // Arrange
    const connectionId = "test-id";
    const controller = new Controller(connectionId, controllerPort);
    const observableHandler = spy(() => new Observable<string>(() => {
      // don't call complete or error here
    }));
    const connection = new Connection(connectionId, controllerPort);
    onConnect!(connection);
    controller.onObservable(observableHandler);
    const messageId = 13;
    const message = "close test";
    let received: unknown;
    clientPort.onmessage = (event: MessageEvent) => {
      received = event.data;
    };
    // Act
    clientPort.postMessage(observeMessage(messageId, message));
    await releaseMicrotask();
    controller.close();
    await releaseMicrotask();
    // Assert
    expect(received).toEqual(errorMessage(messageId, new Error("Connection closed")));
  });

  it("should reject all promises on close", async () => {
    // Arrange
    const connectionId = "test-id";
    const controller = new Controller(connectionId, controllerPort);
    const connection = new Connection(connectionId, controllerPort);
    onConnect!(connection);
    const messageId = 99;
    const message = "pending promise";
    let received: unknown;
    clientPort.onmessage = (event: MessageEvent) => {
      received = event.data;
    };
    // Act: send a promise message but do not attach a handler (so it stays pending)
    clientPort.postMessage(promiseMessage(messageId, message));
    await releaseMicrotask();
    controller.close();
    await releaseMicrotask();
    // Assert
    expect(received).toEqual(rejectMessage(messageId, new Error("Connection closed")));
  });

  it("should call promise handler when message recieved before handler attached", async () => {
    // Arrange
    const connectionId = "test-id";
    const controller = new Controller(connectionId, controllerPort);
    const connection = new Connection(connectionId, controllerPort);
    onConnect!(connection);
    const messageId = 14;
    const message = "late handler";
    let recievedMessageEvent: MessageEvent;
    const listenerSpy = spy((event: MessageEvent) => {
      recievedMessageEvent = event;
    });
    clientPort.onmessage = listenerSpy;
    // Act
    clientPort.postMessage(promiseMessage(messageId, message));
    await releaseMicrotask();
    // Attach handler after message
    const promiseHandler = spy(() => Promise.resolve("late result"));
    controller.onPromise(promiseHandler);
    await releaseMicrotask();
    // Assert
    assertSpyCall(promiseHandler, 0);
    assertSpyCallArg(promiseHandler, 0, 0, message);
    assertSpyCall(listenerSpy, 0);
    expect(recievedMessageEvent!).toBeDefined();
    expect(recievedMessageEvent!.data).toEqual(
      resolveMessage(messageId, "late result"),
    );
  });

  it("should call observable handler when message recieved before handler attached", async () => {
    // Arrange
    const connectionId = "test-id";
    const controller = new Controller(connectionId, controllerPort);
    const connection = new Connection(connectionId, controllerPort);
    onConnect!(connection);
    const messageId = 15;
    const message = "late obs handler";
    let received: unknown;
    clientPort.onmessage = (event: MessageEvent) => {
      received = event.data;
    };
    // Act
    clientPort.postMessage(observeMessage(messageId, message));
    await releaseMicrotask();
    // Attach handler after message
    const observableHandler = spy(() => new Observable<string>((subscriber) => {
      subscriber.next("late value");
    }));
    controller.onObservable(observableHandler);
    await releaseMicrotask();
    // Assert
    assertSpyCall(observableHandler, 0);
    assertSpyCallArg(observableHandler, 0, 0, message);
    expect(received).toEqual(emitMessage(messageId, "late value"));
  });
});
