# Simλ Language Specification (v0.1)

## Overview

Simλ is a deterministic, portable simulation language designed to run the same logic across:

- Browser (JavaScript VM)
- Native C Interpreter
- Native C Bytecode VM

The goal is identical results across all runtimes.

---

## Core Forms

### begin
Evaluate expressions in sequence, return last result.

(begin
  expr1
  expr2
  expr3
)

---

### let
Bind a variable.

(let x 5)

---

### fn
Define a function.

(fn (x y)
  (add x y)
)

---

### if
Conditional expression.

(if condition
  thenExpr
  elseExpr
)

---

## Math

(add a b)
(sub a b)
(mul a b)
(div a b)

---

## Comparison

(lt a b)
(gt a b)
(eq a b)

Returns 1 (true) or 0 (false)

---

## Lists

(list 1 2 3)

(len xs)

(nth xs i)

---

## Higher Order

(map fn xs)
(filter fn xs)
(reduce fn init xs)

---

## Example

(begin
  (let xs (list 1 2 3))
  (map (fn (x) (add x 1)) xs)
)

---

## Determinism

Simλ must produce identical output across:

- JS VM
- C Interpreter
- C Bytecode VM

No randomness, no time-based behavior.

---

## Runtime Compatibility

| Feature            | JS VM | C Interpreter | C Bytecode |
|-------------------|------|---------------|------------|
| begin             | yes  | yes           | yes        |
| let               | yes  | yes           | yes        |
| fn                | yes  | yes           | partial    |
| closures          | yes  | yes           | no         |
| if                | yes  | yes           | yes        |
| math              | yes  | yes           | yes        |
| comparisons       | yes  | yes           | yes        |
| list              | yes  | yes           | yes        |
| len/nth           | yes  | yes           | yes        |
| map/filter/reduce | yes  | yes           | yes        |

---

## Known Gaps

- Bytecode VM does not support closures
- No module/import system

---

## Future Direction

- Bytecode closures
- Standard library formalization
- Simulation-specific primitives
- Deterministic replay support

