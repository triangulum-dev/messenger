import 'reflect-metadata/lite';
/**
 * Symbol key for storing the Controller name metadata on a class constructor.
 */
export declare const CONTROLLER_NAME: unique symbol;
/**
 * Symbol key for storing the types of Controller-decorated methods (promise or observable)
 * on a class's metadata. The value will be an object mapping method names to their type.
 */
export declare const CONTROLLER_METHOD_TYPES: unique symbol;
/**
 * Controller class decorator (experimental decorator with reflect-metadata).
 * Attaches metadata to a class, including an optional name for handler names.
 * This name is used by AppBuilder#addController to namespace mapped promise/observable handlers.
 * The metadata is stored via Reflect.defineMetadata and becomes accessible
 * via Reflect.getMetadata(CONTROLLER_NAME, YourClass).
 *
 * @param args An object containing an optional string `name` for handler names.
 *             If provided, handler names will be generated as `${name}.${functionName}`.
 */
export declare function Controller(args: {
    name?: string;
}): ClassDecorator;
/**
 * Method decorator to mark a method as a promise handler.
 * Stores the method type in metadata using reflect-metadata.
 */
export declare function GetPromise(): MethodDecorator;
/**
 * Method decorator to mark a method as an observable handler.
 * Stores the method type in metadata using reflect-metadata.
 */
export declare function GetObservable(): MethodDecorator;
//# sourceMappingURL=controller.d.ts.map