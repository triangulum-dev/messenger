"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _ProxyBuilder_instances, _ProxyBuilder_builtProxy, _ProxyBuilder_ensureGetTrap, _ProxyBuilder_ensureSetTrap, _ProxyBuilder_ensureHasTrap, _ProxyBuilder_ensureDeletePropertyTrap, _ProxyBuilder_ensureGetOwnPropertyDescriptorTrap;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyBuilder = void 0;
class ProxyBuilder {
    constructor(target = {}) {
        _ProxyBuilder_instances.add(this);
        Object.defineProperty(this, "target", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: target
        });
        _ProxyBuilder_builtProxy.set(this, null); // Store the proxy reference for 'this' context in methods
        Object.defineProperty(this, "handler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "propertyConfigs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        __classPrivateFieldGet(this, _ProxyBuilder_instances, "m", _ProxyBuilder_ensureGetTrap).call(this);
        __classPrivateFieldGet(this, _ProxyBuilder_instances, "m", _ProxyBuilder_ensureSetTrap).call(this);
        __classPrivateFieldGet(this, _ProxyBuilder_instances, "m", _ProxyBuilder_ensureHasTrap).call(this);
        __classPrivateFieldGet(this, _ProxyBuilder_instances, "m", _ProxyBuilder_ensureDeletePropertyTrap).call(this);
        __classPrivateFieldGet(this, _ProxyBuilder_instances, "m", _ProxyBuilder_ensureGetOwnPropertyDescriptorTrap).call(this);
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
    addProperty(config) {
        const { name, ...rest } = config;
        const isReadOnly = rest.readOnly ?? !rest.set;
        const effectiveConfig = {
            ...rest,
            readOnly: isReadOnly,
            set: isReadOnly ? undefined : rest.set,
            configurable: rest.configurable ?? true,
            enumerable: rest.enumerable ?? true,
            name, // keep name for consistency, though not used in propertyConfigs map
        };
        this.propertyConfigs.set(name, effectiveConfig);
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
    addFunction(config) {
        const { name, func, configurable = true, enumerable = true } = config;
        const boundFuncGetter = () => (...args) => {
            return func.apply(__classPrivateFieldGet(this, _ProxyBuilder_builtProxy, "f"), args);
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
    setApply(handler) {
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
    setConstruct(constructTrap) {
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
    build() {
        if (__classPrivateFieldGet(this, _ProxyBuilder_builtProxy, "f")) {
            throw new Error("Proxy has already been built. Cannot build again.");
        }
        // Ensure the target is an object type
        if (typeof this.target !== "object" &&
            typeof this.target !== "function") {
            throw new TypeError("Proxy target must be an object or a function.");
        }
        const proxy = new Proxy(this.target, this.handler);
        __classPrivateFieldSet(this, _ProxyBuilder_builtProxy, proxy, "f"); // Store reference for method 'this' context
        return proxy;
    }
}
exports.ProxyBuilder = ProxyBuilder;
_ProxyBuilder_builtProxy = new WeakMap(), _ProxyBuilder_instances = new WeakSet(), _ProxyBuilder_ensureGetTrap = function _ProxyBuilder_ensureGetTrap() {
    if (!this.handler.get) {
        this.handler.get = (target, prop, receiver) => {
            if (this.propertyConfigs.has(prop)) {
                // Property managed by the builder
                const config = this.propertyConfigs.get(prop);
                try {
                    if (config.get) {
                        // Use receiver as 'this' context for getter, allows calling super.prop on inherited proxies
                        return config.get.call(receiver);
                    }
                    else {
                        // No getter defined, reflect to target
                        const value = Reflect.get(target, prop, receiver);
                        // If target doesn't have the property, return undefined
                        return value === undefined ? undefined : value;
                    }
                }
                catch (e) {
                    console.error(`Error in getter for property '${String(prop)}':`, e);
                    throw e; // Re-throw error
                }
            }
            // Default behavior: Reflect to target
            return Reflect.get(target, prop, receiver);
        };
    }
}, _ProxyBuilder_ensureSetTrap = function _ProxyBuilder_ensureSetTrap() {
    if (!this.handler.set) {
        this.handler.set = (target, prop, value, receiver) => {
            if (this.propertyConfigs.has(prop)) {
                // Property managed by the builder
                const config = this.propertyConfigs.get(prop);
                if (config.readOnly || !config.set) {
                    throw new TypeError(`Property '${String(prop)}' is read-only.`);
                }
                try {
                    // Use receiver as 'this' context for setter
                    config.set.call(receiver, value);
                    // config.set(value); // Simpler alternative
                    return true; // Indicate success
                }
                catch (e) {
                    console.error(`Error in setter for property '${String(prop)}':`, e);
                    // Return false or throw, depending on desired strictness
                    return false;
                }
            }
            // Default behavior: Reflect to target
            return Reflect.set(target, prop, value, receiver);
        };
    }
}, _ProxyBuilder_ensureHasTrap = function _ProxyBuilder_ensureHasTrap() {
    if (!this.handler.has) {
        this.handler.has = (target, prop) => {
            // Check builder-managed properties first, then reflect
            return this.propertyConfigs.has(prop) ||
                Reflect.has(target, prop);
        };
    }
}, _ProxyBuilder_ensureDeletePropertyTrap = function _ProxyBuilder_ensureDeletePropertyTrap() {
    if (!this.handler.deleteProperty) {
        this.handler.deleteProperty = (target, prop) => {
            if (this.propertyConfigs.has(prop)) {
                // Property managed by the builder
                const config = this.propertyConfigs.get(prop);
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
}, _ProxyBuilder_ensureGetOwnPropertyDescriptorTrap = function _ProxyBuilder_ensureGetOwnPropertyDescriptorTrap() {
    if (!this.handler.getOwnPropertyDescriptor) {
        this.handler.getOwnPropertyDescriptor = (target, prop) => {
            if (this.propertyConfigs.has(prop)) {
                // Property managed by the builder
                const config = this.propertyConfigs.get(prop);
                // Construct the descriptor based on our config
                const descriptor = {
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
};
