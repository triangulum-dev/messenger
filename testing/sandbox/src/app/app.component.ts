import { Component, signal } from '@angular/core';

import { AsyncPipe, JsonPipe } from '@angular/common';
import { client } from '@triangulum/messenger';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [AsyncPipe, JsonPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  testclient = client<{
    time$: (n: number) => Observable<number>;
    calculateNthPrime: (n: number) => Promise<number>;
  }>(new Worker(new URL('./test-worker.worker', import.meta.url)));

  time$ = this.testclient.time$(3);

  primes = signal<number[]>([]);

  async calculateNthPrime() {
    const prime = await this.testclient.calculateNthPrime(
      Math.floor(Math.random() * 100000)
    );
    this.primes.update((primse) => [prime, ...primse]);
  }
}
