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
 * Controller class decorator (modern ECMAScript decorator).
 * Attaches metadata to a class, including an optional name for handler names.
 * This name is used by AppBuilder#addController to namespace mapped promise/observable handlers.
 * The metadata is stored on \`context.metadata\` and becomes accessible
 * via \`YourClass[Symbol.metadata][CONTROLLER_NAME]\`.
 *
 * @param args An object containing an optional string \`name\` for handler names.
 *             If provided, handler names will be generated as \`\${name}.\${functionName}\`.
 */
export declare function Controller(args: {
    name?: string;
}): (targetClass: new (...args: unknown[]) => object, context: ClassDecoratorContext) => void;
export declare function GetPromise(): (target: object, context: ClassMethodDecoratorContext) => void;
export declare function GetObservable(): (target: object, context: ClassMethodDecoratorContext) => void;
//# sourceMappingURL=controller.d.ts.map