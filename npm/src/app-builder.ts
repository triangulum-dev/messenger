import type { Observable } from "rxjs";
import { AppContext } from "./app-context.js";
import type { MessageTarget } from "./model.js";
import { AppReference } from "./app-reference.js";
import { CONTROLLER_METHOD_TYPES, CONTROLLER_NAME } from "./controller.js";

export class AppBuilder {
  #promiseHandlers: Record<string, (...args: unknown[]) => Promise<unknown>> =
    {};
  #observableHandlers: Record<
    string,
    (...args: unknown[]) => Observable<unknown>
  > = {};
  #built = false;

  constructor(readonly target: MessageTarget) {}

  mapPromise<
    Name extends string,
    Args extends unknown[],
    Ret,
  >(
    name: Name,
    handler: (...args: Args) => Promise<Ret>,
  ): AppBuilder {
    this.#promiseHandlers[name] = handler as (
      ...args: unknown[]
    ) => Promise<unknown>;
    return this;
  }

  mapObservable<
    Name extends string,
    Args extends unknown[],
    Ret,
  >(
    name: Name,
    handler: (...args: Args) => Observable<Ret>,
  ): AppBuilder {
    this.#observableHandlers[name] = handler as (
      ...args: unknown[]
    ) => Observable<unknown>;
    return this;
  }

  addController(controllerInstance: object): AppBuilder {
    const constructor = controllerInstance.constructor as (new (
      ...args: unknown[]
    ) => object);

    const name = Reflect.getMetadata(CONTROLLER_NAME, constructor) as
      | string
      | undefined;
    const methodTypes = Reflect.getMetadata(
      CONTROLLER_METHOD_TYPES,
      constructor,
    ) as
      | Record<string, "promise" | "observable">
      | undefined;

    if (!methodTypes) {
      throw new Error(
        `AppBuilder: Controller class ${constructor.name} has no methods decorated with @promise or @observable.`,
      );
    }

    for (const methodName in methodTypes) {
      const handler =
        (controllerInstance as Record<string, (...args: unknown[]) => unknown>)[
          methodName
        ];
      if (typeof handler !== "function") {
        console.warn(
          `AppBuilder: Expected method ${methodName} on ${constructor.name} to be a function, but got ${typeof handler}.`,
        );
        continue;
      }

      const boundHandler = handler.bind(controllerInstance);
      const handlerName = name ? `${name}.${methodName}` : methodName;

      if (methodTypes[methodName] === "promise") {
        this.mapPromise(
          handlerName,
          boundHandler as (...args: unknown[]) => Promise<unknown>,
        );
      } else if (methodTypes[methodName] === "observable") {
        this.mapObservable(
          handlerName,
          boundHandler as (...args: unknown[]) => Observable<unknown>,
        );
      }
    }
    return this;
  }

  build(): AppReference {
    if (this.#built) throw new Error("AppBuilder: already built");
    this.#built = true;
    const appContext = new AppContext(this.target);

    return new AppReference(
      appContext,
      this.#promiseHandlers,
      this.#observableHandlers,
    );
  }
}
