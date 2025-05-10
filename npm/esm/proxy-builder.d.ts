export interface PropertyConfig<P> {
    /** The property name (string or symbol). */
    name: string | symbol;
    /** The getter function for the property. */
    get?: () => P;
    /** The optional setter function. If omitted or readOnly is true, the property is read-only. */
    set?: (value: P) => void;
    /** Explicitly mark the property as read-only. Defaults to false if 'set' is provided, true otherwise. */
    readOnly?: boolean;
    /** Make the property configurable (default: true) */
    configurable?: boolean;
    /** Make the property enumerable (default: true) */
    enumerable?: boolean;
}
export interface FunctionConfig<A extends unknown[] = unknown[], R = unknown> {
    name: string | symbol;
    func: (...args: A) => R;
    configurable?: boolean;
    enumerable?: boolean;
}
export declare class ProxyBuilder<T extends object> {
    #private;
    readonly target: T;
    handler: ProxyHandler<T>;
    propertyConfigs: Map<string | symbol, PropertyConfig<unknown>>;
    constructor(target?: T);
    /**
     * Adds a property to the proxy.
     * This configures the 'get', 'set', 'has', and 'getOwnPropertyDescriptor' traps
     * for this specific property.
     *
     * @template P The type of the property being added.
     * @param config The property configuration.
     * @returns The ProxyBuilder instance for chaining.
     */
    addProperty<P>(config: PropertyConfig<P>): this;
    /**
     * Adds a function (method) to the proxy.
     * This is a convenience method that uses addProperty internally, marking the property as read-only by default.
     *
     * @template A Tuple type for the function's arguments.
     * @template R The return type of the function.
     * @param config Object containing name, func, configurable, and enumerable.
     * @returns The ProxyBuilder instance for chaining.
     */
    addFunction<A extends unknown[], R>(config: FunctionConfig<A, R>): this;
    /**
     * Sets the 'apply' trap for the proxy.
     * This is only relevant if the target object is a function.
     * This trap can only be set once. Subsequent calls will overwrite the previous one.
     *
     * @param handler The handler function for the 'apply' trap.
     * @returns The ProxyBuilder instance for chaining.
     */
    setApply(handler: (target: T, thisArg: unknown, argArray: unknown[]) => unknown): this;
    /**
     * Sets the 'construct' trap for the proxy.
     * This is only relevant if the target object is a constructor.
     * This trap can only be set once. Subsequent calls will overwrite the previous one.
     *
     * @param constructTrap The handler function for the 'construct' trap.
     * @returns The ProxyBuilder instance for chaining.
     */
    setConstruct(constructTrap: (target: T, argArray: unknown[], newTarget: Function) => object): this;
    /**
     * Builds the Proxy object based on the configurations.
     *
     * @returns The newly created Proxy object.
     */
    build(): T;
}
//# sourceMappingURL=proxy-builder.d.ts.map