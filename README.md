# Simλ

Simλ is a deterministic, functional language for evolving entity-based world state over time.

## Core Ideas

- Lisp-style syntax
- Pure transformations (`map`, `filter`, `reduce`)
- Deterministic execution
- Designed for simulation and game logic

## Example

(begin
  (let entities
    (list
      (list "id" 1 "hp" 10)
      (list "id" 2 "hp" 3)
    )
  )

  (filter
    (fn (e) (gt (get e "hp") 0))
    entities
  )
)

## Use Cases

- Game rules engines
- Deterministic simulations
- Entity systems
- Replayable state machines


## Simλ Language Spec

The current Simλ language specification is documented here:

- [Simλ Language Specification v0.1](docs/SIMLA_SPEC.md)

The spec tracks supported forms, runtime compatibility, and known gaps across the JavaScript VM, C interpreter, and C bytecode VM.

