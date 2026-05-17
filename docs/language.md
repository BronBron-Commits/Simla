# Language Overview

Simla uses an S-expression syntax and is designed around deterministic execution.

## Core Forms

Common forms include:

* `begin` for sequencing
* `let` for local bindings
* `fn` for functions
* `if` for branching
* `list` for structured data

## Small Example

```lisp
(begin
  (let xs (list 1 2 3))
  (map (fn (x) (mul x 2)) xs)
)
```

## Data Style

Most scene and simulation data is represented as flat key-value lists, for example:

```lisp
(list "x" 1 "y" 2 "z" 3)
```

## More Detail

For a fuller language reference, see:

* `docs/spec.md`
* `docs/SIMLA_SPEC.md`
* `spec/README.md`