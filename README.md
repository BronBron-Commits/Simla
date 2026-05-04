Simλ (Simla)

A deterministic simulation language for games and systems.

Simla lets you define simulation logic once and run it across multiple runtimes with identical results.

---

What is Simla?

Simla is a small, functional DSL designed for:

* Game logic
* Simulation systems
* Deterministic rule execution

It guarantees that the same .sim program produces identical results across:

* JavaScript VM
* Native C Interpreter
* Native C Bytecode VM

---

Why Simla?

Game and simulation logic is typically:

* duplicated across client and server
* tightly coupled to engine code
* difficult to test deterministically

Simla solves this by making logic:

* portable
* deterministic
* testable
* runtime-independent

Write once → run anywhere → same result

---

Core Features

* Deterministic execution (same inputs → same outputs)
* Functional style (no hidden side effects)
* Cross-runtime parity (JS + C)
* Bytecode compilation pipeline
* Built-in list and functional primitives
* Conformance and error test suites
* Replay-friendly simulation model

---

Example

(if (and (gt 6 3) (lt 2 5)) 10 7)

Run:

./simla.sh example.sim

Output:

10

---

CLI

Run a simulation file:

./simla.sh file.sim

---

Development Checks

Run full validation:

./tools/check_all.sh

This executes:

* Conformance tests (spec correctness)
* Error tests (invalid program handling)
* C build verification
* Cross-runtime parity checks

---

Architecture

.sim source
↓
Parser / AST
↓
Compiler (optional → bytecode)

Execution targets:

* JavaScript VM
* C Interpreter
* C Bytecode VM

All runtimes are expected to produce identical outputs.

---

Project Structure

c-simla/
→ C interpreter and bytecode VM

src/
→ JavaScript VM, compiler, runtime

spec/
→ language specification

tests/
→ conformance and error tests

tools/
→ runners, validation scripts

examples/
→ sample simulation programs

---

Version

Current version: 0.1.0

Core guarantees:

* Deterministic execution
* Cross-runtime parity
* Stable core primitives

---

Philosophy

Simla is not a general-purpose language.

It is a deterministic logic layer:

* define rules
* simulate outcomes
* guarantee consistency across systems

---

Next Direction

* Integration with rendering engines (Three.js / WebXR)
* Higher-level simulation systems (AI, combat, world logic)
* Expanded standard library (kept separate from core)
* Tooling for replay, debugging, and visualization

---

License

MIT
