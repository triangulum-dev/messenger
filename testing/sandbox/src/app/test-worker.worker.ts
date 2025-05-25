/// <reference lib="webworker" />

import { AppBuilder } from "@triangulum/messenger";
import { MyController } from "./my-controller";


const builder = new AppBuilder(globalThis);
builder.addController(new MyController());
const app = builder.build();
app.run();