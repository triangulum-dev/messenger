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

export class ProxyBuilder<T extends object> {
  #builtProxy: T | null = null; // Store the proxy reference for 'this' context in methods

  handler: ProxyHandler<T> = {};

  propertyConfigs: Map<string | symbol, PropertyConfig<unknown>> = new Map();

  constructor(readonly target: T = {} as T) {
    this.#ensureGetTrap();
    this.#ensureSetTrap();
    this.#ensureHasTrap();
    this.#ensureDeletePropertyTrap();
    this.#ensureGetOwnPropertyDescriptorTrap();
  }

  /**
   * Adds a property to the proxy.
   * This configures the 'get', 'set', 'has', and 'getOwnPropertyDescriptor' traps
   * for this specific property.
   *
   * @template P The type of the property being added.
   * @param config The property configuration.
   * @returns The ProxyBuilder instance for chaining.
   */
  addProperty<P>(config: PropertyConfig<P>): this {
    const { name, ...rest } = config;
    const isReadOnly = rest.readOnly ?? !rest.set;
    const effectiveConfig: PropertyConfig<P> = {
      ...rest,
      readOnly: isReadOnly,
      set: isReadOnly ? undefined : rest.set,
      configurable: rest.configurable ?? true,
      enumerable: rest.enumerable ?? true,
      name, // keep name for consistency, though not used in propertyConfigs map
    };

    this.propertyConfigs.set(name, effectiveConfig as PropertyConfig<unknown>);

    return this;
  }

  /**
   * Adds a function (method) to the proxy.
   * This is a convenience method that uses addProperty internally, marking the property as read-only by default.
   *
   * @template A Tuple type for the function's arguments.
   * @template R The return type of the function.
   * @param config Object containing name, func, configurable, and enumerable.
   * @returns The ProxyBuilder instance for chaining.
   */
  addFunction<A extends unknown[], R>(config: FunctionConfig<A, R>): this {
    const { name, func, configurable = true, enumerable = true } = config;
    const boundFuncGetter = () => (...args: A): R => {
      return func.apply(this.#builtProxy, args);
    };

    this.addProperty({
      name,
      get: boundFuncGetter,
      readOnly: true,
      configurable,
      enumerable,
    });
    return this;
  }

  /**
   * Sets the 'apply' trap for the proxy.
   * This is only relevant if the target object is a function.
   * This trap can only be set once. Subsequent calls will overwrite the previous one.
   *
   * @param handler The handler function for the 'apply' trap.
   * @returns The ProxyBuilder instance for chaining.
   */
  setApply(
    handler: (target: T, thisArg: unknown, argArray: unknown[]) => unknown,
  ): this {
    // Basic check: T should ideally be a Function type, but runtime handles actual error
    // if (typeof target !== 'function') console.warn("Target is not a function, 'apply' trap may not work.")
    this.handler.apply = handler;
    return this;
  }

  /**
   * Sets the 'construct' trap for the proxy.
   * This is only relevant if the target object is a constructor.
   * This trap can only be set once. Subsequent calls will overwrite the previous one.
   *
   * @param constructTrap The handler function for the 'construct' trap.
   * @returns The ProxyBuilder instance for chaining.
   */
  setConstruct(
    constructTrap: (
      target: T,
      argArray: unknown[],
      // deno-lint-ignore ban-types
      newTarget: Function,
    ) => object,
  ): this {
    // Basic check: T should ideally be a constructor type
    // if (typeof target !== 'function' || !target.prototype) console.warn("Target is not a constructor, 'construct' trap may not work.")
    this.handler.construct = constructTrap;
    return this;
  }

  /**
   * Builds the Proxy object based on the configurations.
   *
   * @returns The newly created Proxy object.
   */
  build(): T {
    if (this.#builtProxy) {
      throw new Error("Proxy has already been built. Cannot build again.");
    }
    // Ensure the target is an object type
    if (
      typeof this.target !== "object" &&
      typeof this.target !== "function"
    ) {
      throw new TypeError(
        "Proxy target must be an object or a function.",
      );
    }
    const proxy = new Proxy<T>(this.target, this.handler);
    this.#builtProxy = proxy; // Store reference for method 'this' context
    return proxy;
  }

  #ensureGetTrap() {
    if (!this.handler.get) {
      this.handler.get = (target: T, prop: string | symbol, receiver: unknown) => {
        if (this.propertyConfigs.has(prop)) {
          // Property managed by the builder
          const config = this.propertyConfigs.get(prop)!;
          try {
            if (config.get) {
              // Use receiver as 'this' context for getter, allows calling super.prop on inherited proxies
              return config.get.call(receiver);
            } else {
              // No getter defined, reflect to target
              const value = Reflect.get(target, prop, receiver);
              // If target doesn't have the property, return undefined
              return value === undefined ? undefined : value;
            }
          } catch (e) {
            console.error(
              `Error in getter for property '${String(prop)}':`,
              e,
            );
            throw e; // Re-throw error
          }
        }
        // Default behavior: Reflect to target
        return Reflect.get(target, prop, receiver);
      };
    }
  }

  #ensureSetTrap() {
    if (!this.handler.set) {
      this.handler.set = (
        target: T,
        prop: string | symbol,
        value: unknown,
        receiver: unknown
      ) => {
        if (this.propertyConfigs.has(prop)) {
          // Property managed by the builder
          const config = this.propertyConfigs.get(prop)!;
          if (config.readOnly || !config.set) {
            throw new TypeError(`Property '${String(prop)}' is read-only.`);
          }
          try {
            // Use receiver as 'this' context for setter
            config.set.call(receiver, value);
            // config.set(value); // Simpler alternative
            return true; // Indicate success
          } catch (e) {
            console.error(
              `Error in setter for property '${String(prop)}':`,
              e,
            );
            // Return false or throw, depending on desired strictness
            return false;
          }
        }
        // Default behavior: Reflect to target
        return Reflect.set(target, prop, value, receiver);
      };
    }
  }

  #ensureHasTrap() {
    if (!this.handler.has) {
      this.handler.has = (target: T, prop: string | symbol) => {
        // Check builder-managed properties first, then reflect
        return this.propertyConfigs.has(prop) ||
          Reflect.has(target, prop);
      };
    }
  }

  #ensureDeletePropertyTrap() {
    if (!this.handler.deleteProperty) {
      this.handler.deleteProperty = (target: T, prop: string | symbol) => {
        if (this.propertyConfigs.has(prop)) {
          // Property managed by the builder
          const config = this.propertyConfigs.get(prop)!;
          if (!config.configurable) {
            return false; // Cannot delete non-configurable properties
          }
          // Delete from our config map and reflect (though reflecting might be redundant if target doesn't have it)
          this.propertyConfigs.delete(prop);
          return Reflect.deleteProperty(target, prop); // Return success/failure from Reflect
        }
        // Default behavior: Reflect to target
        return Reflect.deleteProperty(target, prop);
      };
    }
  }

  #ensureGetOwnPropertyDescriptorTrap() {
    if (!this.handler.getOwnPropertyDescriptor) {
      this.handler.getOwnPropertyDescriptor = (target: T, prop: string | symbol) => {
        if (this.propertyConfigs.has(prop)) {
          // Property managed by the builder
          const config = this.propertyConfigs.get(prop)!;
          // Construct the descriptor based on our config
          const descriptor: PropertyDescriptor = {
            configurable: config.configurable ?? true,
            enumerable: config.enumerable ?? true,
            // Only include 'get' if it exists
            ...(config.get && { get: config.get }),
            // Only include 'set' if it exists (i.e., not read-only)
            ...(config.set && { set: config.set }),
            // If no getter/setter, maybe define 'value' and 'writable'?
            // For this builder, we assume get/set define the property value implicitly.
            // If you needed static values, addProperty would need 'value' and 'writable' options.
          };
          return descriptor;
        }
        // Default behavior: Reflect to target
        return Reflect.getOwnPropertyDescriptor(target, prop);
      };
    }
  }
}
