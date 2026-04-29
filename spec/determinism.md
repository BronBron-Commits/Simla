# Determinism

Simla is deterministic by default.

The same program must produce the same output across all runtimes.

Required agreement:

C interpreter == C bytecode VM == JavaScript VM

## Randomness

Randomness is only allowed when seeded.

same seed = same result

Unseeded randomness is not part of the stable core.

## Floating Point

Avoid depending on tiny floating point differences.

Where possible, prefer integer math for conformance tests.

## State

State changes must happen in a predictable order.

MAP, RANGE, and iteration-based operations must preserve stable ordering.
