// worker.ts
// Decorator to run a class in a Web Worker using ClientBuilder and ControllerBuilder
import { ClientBuilder } from './client-builder';
import { ControllerBuilder } from './controller-builder';

/**
 * @worker Decorator for classes to run their methods in a dynamically created Web Worker.
 *
 * Usage:
 *   @worker
 *   class MyService { ... }
 *
 * When you instantiate MyService, method calls are proxied to a controller in a Web Worker.
 */
export function worker<T extends { new (...args: unknown[]): object }>(target: T): T {
  return class WorkerProxy {
    private _client: Record<string, unknown>;
    private _worker: Worker;
    constructor(..._args: unknown[]) {
      // Dynamically generate the worker script
      const classSource = target.toString();
      const methodNames = Object.getOwnPropertyNames(target.prototype).filter(
        (name) => name !== 'constructor' && typeof target.prototype[name] === 'function'
      );
      // Worker script: imports, class definition, controller setup
      const workerScript = `
        importScripts();
        let ControllerBuilder;
        try {
          ControllerBuilder = self.ControllerBuilder || undefined;
        } catch {}
        if (!ControllerBuilder && typeof importScripts === 'function') {
          try { importScripts('/npm/esm/controller-builder.js'); ControllerBuilder = self.ControllerBuilder; } catch(e) {}
        }
        (${classSource});
        const instance = new ${target.name}();
        const builder = new ControllerBuilder();
        ${methodNames
          .map(
            (name) =>
              `builder.add('${name}', { type: 'promise', handler: (...args) => instance['${name}'](...args) });`
          )
          .join('\n')}
        const controller = builder.build();
        controller.start();
      `;
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      this._worker = new Worker(URL.createObjectURL(blob), { type: 'module' });
      // Build the client interface using ClientBuilder
      const builder = new ClientBuilder(this._worker);
      for (const name of methodNames) {
        builder.add(name, { type: 'promise' });
      }
      this._client = builder.build();
      // Proxy all methods to the client
      for (const name of methodNames) {
        Object.defineProperty(this, name, {
          value: (...args: unknown[]) => {
            const fn = this._client[name];
            if (typeof fn === 'function') {
              return fn(...args);
            }
            throw new Error(`Method ${name} is not a function on client proxy`);
          },
          writable: false,
          enumerable: false,
        });
      }
    }
    terminate() {
      this._worker.terminate();
    }
  } as unknown as T;
}
