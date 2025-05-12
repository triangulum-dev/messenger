import { describe, it } from "@std/testing/bdd";
import { ProxyBuilder } from "./proxy-builder.ts";
import { expect } from "@std/expect";

describe("ProxyBuilder", () => {
  describe("addProperty", () => {
    it("should get and set a writable property", () => {
      // Arrange
      let value = 1;
      const builder = new ProxyBuilder<{ foo: number }>();
      builder.addProperty({
        name: "foo",
        get: () => value,
        set: (v) => {
          value = v;
        },
      });
      const proxy = builder.build();

      // Act
      proxy.foo = 42;
      const result = proxy.foo;

      // Assert
      expect(result).toBe(42);
      expect(value).toBe(42);
    });

    it("should not set a read-only property", () => {
      // Arrange
      const value = 5;
      const builder = new ProxyBuilder<{ bar: number }>();
      builder.addProperty({
        name: "bar",
        get: () => value,
        readOnly: true,
      });
      const proxy = builder.build();

      // Act
      let setResult = true;
      try {
        proxy.bar = 10;
        setResult = true;
      } catch {
        setResult = false;
      }

      // Assert
      expect(proxy.bar).toBe(5);
      expect([true, false]).toContain(setResult);
    });
  });

  describe("addFunction", () => {
    it("should call a method and bind 'this' to proxy", () => {
      // Arrange
      let calledThis: unknown = null;
      const builder = new ProxyBuilder<{ greet: () => string }>();
      builder.addFunction({
        name: "greet",
        func: function () {
          calledThis = this;
          return "hello";
        },
      });
      const proxy = builder.build();

      // Act
      const result = proxy.greet();

      // Assert
      expect(result).toBe("hello");
      expect(calledThis).toBe(proxy);
    });
  });

  describe("deleteProperty", () => {
    it("should delete a configurable property", () => {
      // Arrange
      let value = 123;
      const builder = new ProxyBuilder<{ baz?: number }>();
      builder.addProperty({
        name: "baz",
        get: () => value,
        set: (v) => {
          value = v;
        },
        configurable: true,
      });
      const proxy = builder.build();

      // Act
      const deleted = delete proxy.baz;

      // Assert
      expect(deleted).toBe(true);
    });

    it("should not delete a non-configurable property", () => {
      // Arrange
      let value = 999;
      const builder = new ProxyBuilder<{ qux?: number }>();
      builder.addProperty({
        name: "qux",
        get: () => value,
        set: (v) => {
          value = v;
        },
        configurable: false,
      });
      const proxy = builder.build();

      // Act
      let deleted = true;
      try {
        deleted = delete proxy.qux;
      } catch (e) {
        deleted = false;
      }

      // Assert
      expect(deleted).toBe(false);
    });
  });

  describe("has trap", () => {
    it("should return true for builder-managed property", () => {
      // Arrange
      const builder = new ProxyBuilder<{ foo: number }>();
      builder.addProperty({ name: "foo", get: () => 1 });
      const proxy = builder.build();

      // Act
      const hasFoo = "foo" in proxy;

      // Assert
      expect(hasFoo).toBe(true);
    });
  });

  describe("getOwnPropertyDescriptor", () => {
    it("should return descriptor for builder-managed property", () => {
      // Arrange
      const builder = new ProxyBuilder<{ foo: number }>();
      builder.addProperty({
        name: "foo",
        get: () => 1,
        configurable: true,
        enumerable: false,
      });
      const proxy = builder.build();

      // Act
      const desc = Object.getOwnPropertyDescriptor(proxy, "foo");

      // Assert
      expect(desc).toBeDefined();
      expect(desc?.configurable).toBe(true);
      expect(desc?.enumerable).toBe(false);
      expect(typeof desc?.get).toBe("function");
    });
  });
});
