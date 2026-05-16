Simλ (Simla)

A deterministic simulation language for games and systems.



Simla lets you define simulation logic once and run it across multiple run<img width="904" height="448" alt="1000008470" src="https://github.com/user-attachments/assets/8a86f4c5-c654-4a95-afbf-886eac4cb0e4" />
<img width="1860" height="895" alt="1000008472" src="https://github.com/user-attachments/assets/889eeb66-8543-4dfa-b320-62f37de2dfe4" />
<img width="1845" height="948" alt="1000008473" src="https://github.com/user-attachments/assets/9da85688-aa88-45db-9924-7a11ded2111b" />
times with identical results.

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
