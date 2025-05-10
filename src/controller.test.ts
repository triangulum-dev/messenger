import { beforeEach, describe, it } from "@std/testing/bdd";
import { spy } from "@std/testing/mock";
import { Controller } from "./controller.ts";
import { releaseMicrotask } from "./utils.ts";
import { expect } from "@std/expect/expect";
import { connectMessage, promiseMessage } from "./messages.ts";

describe("Controller", () => {
  let messageTarget: MessagePort;
  let messageSource: MessagePort;

  beforeEach(() => {
    const channel = new MessageChannel();
    messageTarget = channel.port1;
    messageSource = channel.port2;

  });

  it("should call the promise handler and resolve the result", async () => {
    // Arrange
    const connectionId = 'test-id';
    const messageId = 3;
    const message = "test message";
    const targetMessageListener = spy();
    messageTarget.addEventListener('message', targetMessageListener);
    const controller = new Controller(connectionId, messageSource);
    const promiseHandler = spy(() => Promise.resolve("test resolve"));
    controller.onPromise(promiseHandler);
    messageTarget.postMessage(connectMessage(connectionId), [messageSource]);
    
    // Act
    messageTarget.postMessage(promiseMessage(messageId, message));
    await releaseMicrotask();

    // Assert
    expect(promiseHandler).toHaveBeenCalledWith(message);
    expect(targetMessageListener).toHaveBeenCalled();
  });

  it("should call the promise handler and reject on error", () => {
    // Arrange
    // Act
    // Assert
  });

  it("should call the observable handler and emit values", () => {
    // Arrange
    // Act
    // Assert
  });

  it("should call the observable handler and handle errors", () => {
    // Arrange
    // Act
    // Assert
  });

  it("should call the observable handler and complete", () => {
    // Arrange
    // Act
    // Assert
  });

  it("should close all connections when close is called", () => {
    // Arrange
    // Act
    // Assert
  });

  it("should ignore unknown message types", () => {
    // Arrange
    // Act
    // Assert
  });

  it("should complete all observables on close", () => {
    // Arrange
    // Act
    // Assert
  });

  it("should call promise handler when message recieved before handler attached", () => {
    // Arrange
    // Act
    // Assert
  });

  it("should call observable handler when message recieved before handler attached", () => {
    // Arrange
    // Act
    // Assert
  });
});
