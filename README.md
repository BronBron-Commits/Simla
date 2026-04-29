# Simλ (Simla)

A portable, deterministic simulation language for games and systems.

Simλ is a small, functional DSL designed to run the same logic across multiple runtimes with identical results:

- Browser (JavaScript VM)
- Native C Interpreter
- Native C Bytecode VM

---

## Why Simλ?

Most game logic is:

- duplicated across client/server
- hardcoded into engines
- difficult to test deterministically

Simλ solves this by making game logic data-driven and portable.

.sim file → same result everywhere

---

## Key Features

- Deterministic execution
- Functional style (no side effects)
- Cross-runtime parity (JS + C)
- Bytecode compilation (performance path)
- Executable spec + test suite
- Built-in list + functional primitives

---

## Example

(begin
  (let clampMove
    (fn (player selected enemy moveRange)
      (if (eq selected enemy)
        player
        (if (lt selected (sub player moveRange))
          player
          (if (gt selected (add player moveRange))
            player
            selected
          )
        )
      )
    )
  )

  (clampMove 7 10 14 3)
)

Result:

10

---

## Architecture

Simλ Source (.sim)
        ↓
   Parser / AST
        ↓
 ┌───────────────┬───────────────┬───────────────┐
 │ JS VM         │ C Interpreter │ C Bytecode VM │
 └───────────────┴───────────────┴───────────────┘
        ↓
   Identical Output

---

## Project Structure

c-simla/
  simla.c                → C interpreter
  vm.c                   → bytecode VM
  compile_test.c         → compiler
  spec/                  → executable spec tests
  spec/errors/           → error semantics tests
  run_tests.sh           → interpreter tests
  run_bytecode_tests.sh  → bytecode tests
  run_parity_tests.sh    → JS/C parity
  run_error_tests.sh     → error validation
  Makefile               → build + test workflow

docs/
  SIMLA_SPEC.md          → language spec

---

## Running

cd c-simla
make check

Runs:

- interpreter tests
- bytecode tests
- cross-runtime parity
- error semantics tests

---

## Language Overview

### Core

(begin ...)
(let x 5)
(fn (x) ...)
(if cond then else)

### Math

(add a b)
(sub a b)
(mul a b)
(div a b)

### Comparison

(lt a b)
(gt a b)
(eq a b)

### Lists

(list 1 2 3)
(len xs)
(nth xs i)

### Higher Order

(map fn xs)
(filter fn xs)
(reduce fn init xs)

---

## Determinism

Simλ guarantees:

- same input → same output
- across all runtimes

No:

- randomness
- time-based behavior
- hidden state

---

## Current Status

✔ Stable core language  
✔ Cross-runtime parity (JS + C + bytecode)  
✔ Executable specification  
✔ CI pipeline validation  
✔ Browser integration for game rules

---

## Known Gaps

- Bytecode closures
- Bytecode map/filter/reduce
- Module/import system
- Symbol validation in bytecode compiler

---

## Vision

Simλ is designed to power:

- deterministic multiplayer game logic
- AI behaviors
- simulation systems
- replayable game states
- moddable rule systems

Engine = rendering + input  
Simλ = rules + logic

---

## Development

make test  
make bytecode  
make parity  
make check

---

## License

MIT

---

## Final Note

Simλ started as a “mini compiler”.

It is now:

a portable deterministic simulation runtime

---

This version keeps all the original formatting and structure while removing every backtick. It should render cleanly in most markdown viewers and plain text contexts. Let me know if you'd like any further adjustments!
