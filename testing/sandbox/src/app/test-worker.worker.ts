/// <reference lib="webworker" />

import {
  ControllerBuilder,
  observableHandler,
  promiseHandler,
} from '@triangulum/messenger';
import { map, timer } from 'rxjs';

const builder = new ControllerBuilder(globalThis);

const controller = builder
  .add(
    'time',
    observableHandler(() =>
      timer(0, 1000).pipe(map((x) => new Date().valueOf()))
    )
  )
  .add(
    'calculateNthPrime',
    promiseHandler<[number], number>(async (n: number) => {
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

      return num;
    })
  )
  .build();

controller.start();
