import { Component, signal } from '@angular/core';
import { ClientBuilder } from '../../../../npm/esm/client-builder';
import { AsyncPipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [AsyncPipe, JsonPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  client = new ClientBuilder(
    'test-worker',
    new Worker(new URL('./test-worker.worker', import.meta.url))
  )
    .addObservableFunction<'time', [], number>('time')
    .addPromiseFunction<'calculateNthPrime', [number], number>(
      'calculateNthPrime'
    )
    .build();

  time$ = this.client.time();

  primes = signal<number[]>([]);

  async calculateNthPrime() {
    const prime = await this.client.calculateNthPrime(
      Math.floor(Math.random() * 100000)
    );
    this.primes.update((primse) => [prime, ...primse]);
  }
}
