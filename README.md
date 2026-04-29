---

# Simλ (Simla)

A deterministic simulation language for games and systems.

Simla lets you write logic once and run it across multiple runtimes with identical results.

---

## What is Simla?

Simla is a small functional DSL designed for:

- Game logic
- Simulation systems
- Deterministic rule execution

It guarantees that the same `.sim` program produces the same result across:

- JavaScript VM
- Native C Interpreter
- Native C Bytecode VM

---

## Why Simla?

Game and simulation logic is usually:

- duplicated across client/server
- tightly coupled to engine code
- hard to test deterministically

Simla solves this by making logic:

- portable
- testable
- runtime-independent

.sim file → same result everywhere

---

## Features

- Deterministic execution
- Functional style (no side effects)
- Cross-runtime parity (JS + C)
- Bytecode compilation path
- Built-in list + functional primitives
- Conformance + error test suites

---

## Example

```lisp
(if (and (gt 6 3) (lt 2 5))
  10
  7)

Run it:

./simla.sh example.sim

Output:

10


---

CLI

./simla.sh file.sim


---

Development Checks

Run full validation:

./tools/check_all.sh

This runs:

conformance tests (spec correctness)

error tests (invalid program handling)

C build verification



---

Architecture

.sim source
   ↓
Parser / AST
   ↓
JS VM ──────┐
C Interpreter │ → identical result
C Bytecode VM┘


---

Project Structure

c-simla/    → C interpreter + bytecode VM
src/        → JS VM + compiler
spec/       → language definition
tests/      → conformance + error tests
tools/      → test runners
examples/   → usage examples


---

Version

Current version: 0.1.0

Core guarantees:

deterministic execution

cross-runtime parity

stable core primitives



---

Philosophy

Simla is not trying to be a general-purpose language.

It is a deterministic logic layer:

define rules

simulate outcomes

keep results consistent across systems



---

Next Direction

integrate with game engine (Three.js / WebXR)

expand standard library (not core language)

build higher-level simulation systems



---

License

MIT
