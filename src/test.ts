import { expect } from "@std/expect";
import { Client } from "./client.ts";
import { Controller } from "./index.ts";
import { releaseMicrotask } from "./utils.ts";

Deno.test("Controller should connect and recieve client messages.", async () => {
  const id = "test";

  const channel = new MessageChannel();

  const controller = new Controller(
    id,
    channel.port2,
  );

  const client = new Client(
    id,
    channel.port1,
  );

  let recievedMessage;

  controller.on((message) => {
    recievedMessage = message;
  });

  client.send("test");

  await releaseMicrotask();

  expect(recievedMessage).toBe("test");

  // Clean up ports to prevent test leak error
  controller.close();
  client.close();
  channel.port1.close();
  channel.port2.close();
});

// Deno.test("Controller should not recieve messages from clients with different ids.", async () => {
//   const id = "test";
//   const id2 = "test2";

//   const channel = new MessageChannel();

//   const controller = new MessengerController(
//     id,
//     channel.port2,
//   );

//   const controller2 = new MessengerController(
//     id2,
//     channel.port2,
//   );

//   const client = new MessengerClient(
//     id2,
//     channel.port1,
//   );

//   let recievedMessage;

//   controller.on((message) => {
//     recievedMessage = message;
//   });

//   client.send("test");

//   await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for the message to be processed

//   expect(recievedMessage).toBeUndefined();

//   // Clean up ports to prevent test leak error
//   controller.close();
//   controller2.close();
//   client.close();
//   channel.port1.close();
//   channel.port2.close();
// });

// Deno.test("Client request should be rejected on controller error.", async () => {
//   const id = "test";

//   const channel = new MessageChannel();

//   const controller = new MessengerController(
//     id,
//     channel.port2,
//   );

//   const client = new MessengerClient(
//     id,
//     channel.port1,
//   );

//   let errorMessage;

//   controller.on(() => {
//     throw new Error("Test error");
//   });

//   try {
//     await client.send("test expect error");
//   } catch (error) {
//     errorMessage = error;
//   }

//   expect(errorMessage).toBeInstanceOf(Error);
//   expect((errorMessage as Error).message).toBe("Test error");

//   // Clean up ports to prevent test leak error
//   controller.close();
//   client.close();
//   channel.port1.close();
//   channel.port2.close();
// });
