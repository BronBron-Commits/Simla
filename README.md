# Minicompiler

A minimal Lisp-style language with its own compiler, virtual machine, and real-time graphics pipeline.

---

## What this is

Minicompiler is a small but fully functional programming language that:

- Parses Lisp-like syntax
- Compiles to bytecode
- Executes in a custom VM
- Drives real-time graphics via a Canvas renderer

It is effectively a **mini game engine scripting language**.

---

## Features

### Language
- Numbers, strings
- Variables (`let`)
- Functions (`fn`)
- Anonymous functions
- Closures
- Conditionals (`if`)
- Blocks (`begin`)
- Arithmetic (`add`, `sub`, `mul`, `div`)
- Comparisons (`gt`, `lt`, `eq`)
- Logical (`or`)

### Data
- Lists `(list ...)`
- `first`, `rest`, `cons`, `len`

### Functional Programming
- `map`
- `reduce`

### Math
- `sin`, `cos`

---

## Runtime / Engine

- Custom stack-based VM
- Persistent global state across frames
- Time input (`time`)
- Keyboard input (`keyW`, `keyA`, `keyS`, `keyD`)
- Deterministic execution model

---

## Graphics

Programs output structured data that is rendered as graphics:

### Example
```lisp
(list
  (list "rect" 50 50 100 100 255 0 0)
  (list "circle" 200 200 40 0 0 255))
````

Supported primitives:

* `"rect"` → x y width height r g b
* `"circle"` → x y radius r g b

---

## Input

Keyboard state is exposed as globals:

```
keyW keyA keyS keyD
```

Example movement:

```lisp
(begin
  (let x (or x 400))
  (let y (or y 300))

  (let x (add x (sub keyD keyA)))
  (let y (add y (sub keyS keyW)))

  (list
    (list "circle" x y 20 255 0 0)))
```

---

## Animation

Time is available as a global:

```
time
```

Example:

```lisp
(list
  (list "circle"
    (add 200 (mul 100 (sin time)))
    200
    30))
```

---

## How it works

```
Source (.mc)
  ↓
Tokenizer
  ↓
Parser (AST)
  ↓
Compiler (bytecode)
  ↓
VM execution
  ↓
Graphics commands (lists)
  ↓
Canvas renderer
```

---

## Running

Start the dev server:

```bash
node serve.js
```

Open in browser:

```
http://localhost:8080
```

---

## Project Structure

```
src/
  parser.js
  compiler.js
  vm.js

renderer.js
index.js
examples/
```

---

## Goals

* Build a minimal but expressive language
* Explore compiler + VM design
* Drive a graphics/game system from code
* Enable deterministic simulation

---

## Future Work

* Physics (velocity, collision)
* Entities / game objects
* Mouse input
* WebGL / Three.js backend
* Networking / multiplayer sync
* Deterministic replay system

---

## Status

Working:

* Compiler ✔
* VM ✔
* Functional programming ✔
* Graphics ✔
* Input ✔
* Animation ✔

---

## Summary

Minicompiler is not just a compiler — it's the foundation of a programmable runtime capable of powering interactive systems and games.

---
