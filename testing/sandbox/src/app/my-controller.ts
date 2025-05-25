import { Controller, GetObservable, GetPromise } from '@triangulum/messenger';
import { map, timer } from 'rxjs';

@Controller({})
export class MyController {
  @GetPromise()
  calculateNthPrime(n: number): Promise<number> {
    if (n < 1) {
      throw new Error('n must be greater than 0');
    }
    let count = 0;
    let num = 1;
    while (count < n) {
      num++;
      let isPrime = true;
      for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) {
        count++;
      }
    }

    return Promise.resolve(num);
  }

  @GetObservable()
  time() {
    return timer(0, 1000).pipe(map((x) => new Date().valueOf()));
  }
}
