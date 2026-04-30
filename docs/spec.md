# Simλ Specification
Version: 0.1.0

Simλ is a deterministic, stack-based functional simulation language.

---

## 1. Execution Model

- Programs execute as a sequence of instructions
- A global stack is used for all operations
- Evaluation is deterministic:
  - Same input + same program = identical output

---

## 2. Core Concepts

### Stack
- Primary data structure
- All operations consume and produce values on the stack

### Values
- Number
- List
- Function
- Boolean

### Environment
- Functions may capture variables (closures)
- Environment persists across frames

---

## 3. Instruction Set

### MAP
Input:
  [list, function]

Behavior:
- Applies function to each element of list
- Returns new list
- Order preserved

---

### OR
Input:
  [a, b]

Behavior:
- Returns a if truthy, otherwise b

---

### CALL
Input:
  [function, args...]

Behavior:
- Executes function with arguments
- Pushes return value to stack

---

### DAMAGE_ALL
Input:
  [entities, damage]

Behavior:
- Applies damage to all entities
- Returns updated entity list

---

## 4. Determinism Rules

- No randomness unless seeded
- No reliance on system time
- No mutation outside VM-controlled state

---

## 5. Errors

- Calling non-function → runtime error
- Invalid stack shape → runtime error

---

## 6. Versioning

This spec defines Simλ version 0.1.0
All VM behavior must conform to this document.

---

## 7. Function Return Semantics

- A function returns the top value on the stack after execution
- The stack must contain at least one value at function exit
- All other intermediate values should be consumed

Example:

Function:
  params: ["x"]
  body:
    LOAD x
    PUSH 2
    MUL

Result:
  returns x * 2

---

## 7. Function Return Semantics

- A function returns the top value on the stack after execution
- The stack must contain at least one value at function exit
- All other intermediate values should be consumed

Example:

Function:
  params: ["x"]
  body:
    LOAD x
    PUSH 2
    MUL

Result:
  returns x * 2
