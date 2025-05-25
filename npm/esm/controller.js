import 'reflect-metadata/lite';
/**
 * Symbol key for storing the Controller name metadata on a class constructor.
 */
export const CONTROLLER_NAME = Symbol.for("@triangulum/controller/v1/symbols/name");
/**
 * Symbol key for storing the types of Controller-decorated methods (promise or observable)
 * on a class's metadata. The value will be an object mapping method names to their type.
 */
export const CONTROLLER_METHOD_TYPES = Symbol.for("@triangulum/controller/v1/symbols/methodTypes");
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
export function Controller(args) {
    return function (target) {
        Reflect.defineMetadata(CONTROLLER_NAME, args.name, target);
    };
}
/**
 * Method decorator to mark a method as a promise handler.
 * Stores the method type in metadata using reflect-metadata.
 */
export function GetPromise() {
    return function (target, propertyKey, _descriptor) {
        const ctor = typeof target === 'function' ? target : target.constructor;
        const existing = Reflect.getMetadata(CONTROLLER_METHOD_TYPES, ctor) || {};
        existing[propertyKey] = 'promise';
        Reflect.defineMetadata(CONTROLLER_METHOD_TYPES, existing, ctor);
    };
}
/**
 * Method decorator to mark a method as an observable handler.
 * Stores the method type in metadata using reflect-metadata.
 */
export function GetObservable() {
    return function (target, propertyKey, _descriptor) {
        const ctor = typeof target === 'function' ? target : target.constructor;
        const existing = Reflect.getMetadata(CONTROLLER_METHOD_TYPES, ctor) || {};
        existing[propertyKey] = 'observable';
        Reflect.defineMetadata(CONTROLLER_METHOD_TYPES, existing, ctor);
    };
}
