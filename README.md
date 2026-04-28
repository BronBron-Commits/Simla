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
