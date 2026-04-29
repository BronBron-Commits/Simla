# Simλ Language Specification

## 1. Overview

Simλ (SimLambda) is a small, deterministic, functional programming language designed for:

- Simulation
- Procedural scene generation
- Deterministic systems (e.g. combat, animation, replay)

Simλ programs compile to bytecode and execute on a custom virtual machine.

---

## 2. Core Principles

- Deterministic: Same input → same output
- Functional-first: Emphasis on pure transformations
- Data-driven: Programs construct and transform data
- Minimal: Small set of primitives, composable into complex behavior

---

## 3. Syntax

Simλ uses an S-expression syntax:

(function arg1 arg2 ...)

Examples:

(add 1 2)
(mul x 10)
(if (gt x 5) 1 0)

---

## 4. Data Types

### 4.1 Numbers

42
3.14

### 4.2 Booleans

true
false

### 4.3 Lists

(list 1 2 3)

### 4.4 Objects (key-value lists)

(list "x" 1 "y" 2)

Objects are represented as flat key-value lists.

---

## 5. Variables

Variables are introduced using let:

(let x 10)

Scope is lexical.

---

## 6. Functions

Functions are first-class values.

(fn (x)
  (mul x 2)
)

Function Call

(f 10)

---

## 7. Recursion

(let fact
  (fn (n)
    (if (eq n 0)
      1
      (mul n (fact (sub n 1)))
    )
  )
)

---

## 8. Control Flow

if

(if condition then else)

Example:

(if (gt x 5) 1 0)

---

## 9. Core Operations

Arithmetic

add sub mul div min max

Comparison

gt lt eq

Logic

and or

---

## 10. List Operations

map
Applies function to each element.

filter
Filters elements by predicate.

reduce
Reduces list to a value.

nth
Access index: (nth xs 0)

concat
Concatenate lists.

slice
(slice xs 1)

empty
Returns true if list is empty.

---

## 11. Function Semantics

Functions return the last value produced.

Stack-based execution.
Intermediate values should be consumed.

Example:

(fn (x)
  (mul x 2)
)

Returns: x * 2

---

## 12. Execution Model

Simλ compiles to bytecode instructions such as:

PUSH LOAD STORE CALL MAP FILTER IF

Execution is stack-based.

---

## 13. Determinism

Simλ guarantees:

No hidden state
No randomness (unless explicitly added)
Same inputs produce identical outputs

---

## 14. Built-in Simulation Ops

damage_all
Applies combat damage across entities.
(damage_all entities tick)

battle_report
Produces summary statistics:
(battle_report entities ticks initialPlayerHp initialEnemyHp)

Returns:
(list
  "ticks" ...
  "winner" ...
  "playersAlive" ...
  "enemiesAlive" ...
)

---

## 15. CLI Usage

Run a Simλ program:

node simla.js file.sim

Outputs JSON result.

---

## 16. Example

(begin
  (let xs (list 1 2 3 4))
  (map (fn (x) (mul x 2)) xs)
)

Output:

[2,4,6,8]

---

## 17. Status

Simλ is an evolving language with:

Recursion support
Deterministic VM
Functional core
Simulation primitives

Future work includes:

Improved object model
Better error handling
Expanded standard library
Rendering integration

---

## 18. Summary

Simλ is:

A deterministic functional language for simulation and procedural systems.

