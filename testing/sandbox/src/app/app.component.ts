import { Component, signal } from '@angular/core';
import { ClientBuilder, observableFunction, promiseFunction } from '../../../../npm/esm/client-builder';
import { AsyncPipe, JsonPipe } from '@angular/common';

export function testClient() {
  return new ClientBuilder(
    'test-worker',
    new Worker(new URL('./test-worker.worker', import.meta.url))
  )
    .add('time', observableFunction<[], number>())
    .add('calculateNthPrime', promiseFunction<[number], number>())
    .build();
}

@Component({
  selector: 'app-root',
  imports: [AsyncPipe, JsonPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  client = testClient();

  time$ = this.client.time();

  primes = signal<number[]>([]);

  async calculateNthPrime() {
    const prime = await this.client.calculateNthPrime(
      Math.floor(Math.random() * 100000)
    );
    this.primes.update((primse) => [prime, ...primse]);
  }
}
