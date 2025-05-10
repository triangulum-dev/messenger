// class builder
// pro: simple-ish
// con: lose types, not extensible

import { CoreClient } from "../src/client.ts";

// functional builder
// pro: typesafe, extensible
// con: complex type definitions

// functional lazy instance
// pro: typesafe
// con: not extensible, lack property of features

const builder = new ClientBuilder(
    withProperty('value'),
    withFunction('increment'),
    withContext(() => ({ id: guid() }))
);

const client = builder.build('myid', myTarget, { id: guid()});

const client = new CoreClient(
    'myid',
    myTarget,
    withProperty('value'),
    withFunction('increment')
);

const builder = new ControllerBuilder(
    withProperty('value', ({ context }) => 1),
    withFunction('increment', ({ context }) => {})
);

const controller = builder.build('myid', mySource);

const controller = new Controller(
    'myid',
    mySource,
    withProperty('value', ({ context }) => 1),
    withFunction('increment', ({ context }) => {})
);

// builder
// builder functions as input
// call core add function on builder
// direct client function with same, just no builder required. simply wraps builder.
// second package for rxjs
// binary for generating type
