"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTROLLER_METHOD_TYPES = exports.CONTROLLER_NAME = void 0;
exports.Controller = Controller;
exports.GetPromise = GetPromise;
exports.GetObservable = GetObservable;
/**
 * Symbol key for storing the Controller name metadata on a class constructor.
 */
exports.CONTROLLER_NAME = Symbol.for("@triangulum/controller/v1/symbols/name");
/**
 * Symbol key for storing the types of Controller-decorated methods (promise or observable)
 * on a class's metadata. The value will be an object mapping method names to their type.
 */
exports.CONTROLLER_METHOD_TYPES = Symbol.for("@triangulum/controller/v1/symbols/methodTypes");
/**
 * Controller class decorator (modern ECMAScript decorator).
 * Attaches metadata to a class, including an optional name for handler names.
 * This name is used by AppBuilder#addController to namespace mapped promise/observable handlers.
 * The metadata is stored on \`context.metadata\` and becomes accessible
 * via \`YourClass[Symbol.metadata][CONTROLLER_NAME]\`.
 *
 * @param args An object containing an optional string \`name\` for handler names.
 *             If provided, handler names will be generated as \`\${name}.\${functionName}\`.
 */
function Controller(args) {
    return function (_targetClass, // Target class constructor, nameed with _ as it's not directly modified
    context) {
        // Ensure this decorator is used on a class
        if (context.kind !== "class") {
            // This case should ideally be prevented by TypeScript's type system
            // if the decorator is correctly typed and applied.
            // However, a runtime check can be a safeguard.
            console.error("Controller decorator can only be applied to classes.");
            return;
        }
        // Modern decorators use context.metadata to store metadata.
        // The runtime initializes context.metadata to an object.
        context.metadata[exports.CONTROLLER_NAME] = args.name;
        // No need to return anything (void) as we are augmenting metadata,
        // not replacing the class or adding initializers that modify the class instance/prototype.
    };
}
function GetPromise() {
    return function (_target, // The prototype of the class for an instance method, or the constructor for a static method
    context) {
        if (context.kind !== "method") {
            console.error("Promise decorator can only be applied to methods.");
            return;
        }
        if (typeof context.name === "symbol") {
            console.error("Promise decorator cannot be applied to symbol-named methods.");
            return;
        }
        const methodName = context.name;
        if (!context.metadata[exports.CONTROLLER_METHOD_TYPES]) {
            context.metadata[exports.CONTROLLER_METHOD_TYPES] = {};
        }
        context.metadata[exports.CONTROLLER_METHOD_TYPES][methodName] = "promise";
    };
}
function GetObservable() {
    return function (_target, // The prototype of the class for an instance method, or the constructor for a static method
    context) {
        if (context.kind !== "method") {
            console.error("Observable decorator can only be applied to methods.");
            return;
        }
        if (typeof context.name === "symbol") {
            console.error("Observable decorator cannot be applied to symbol-named methods.");
            return;
        }
        const methodName = context.name;
        if (!context.metadata[exports.CONTROLLER_METHOD_TYPES]) {
            context.metadata[exports.CONTROLLER_METHOD_TYPES] = {};
        }
        context.metadata[exports.CONTROLLER_METHOD_TYPES][methodName] = "observable";
    };
}
