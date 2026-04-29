# Simλ C Compiler

A small C implementation of the Simλ language toolchain.

Goal:

.sim source
→ tokenizer
→ parser / AST
→ evaluator or bytecode compiler
→ native runtime

Initial target:

(print (add 2 3))

Then:

(begin
  (let x 3)
  (add x 4)
)
