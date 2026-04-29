# Simla Self-Hosting Experiments

This folder contains experiments where Simla programs generate bytecode-like data.

## tiny_compiler.sim

A tiny compiler written in Simla.

It compiles a small AST into numeric bytecode.

Opcode mapping:

1 = PUSH
2 = ADD
3 = MUL

AST node mapping:

0 = NUMBER
1 = ADD_NODE
2 = MUL_NODE

Example source tree:

(mul (add 2 3) 4)

Encoded as:

(list
  MUL_NODE
  (list ADD_NODE (list NUMBER 2) (list NUMBER 3))
  (list NUMBER 4)
)

Compiled output:

[1,2,1,3,2,1,4,3]

Which means:

PUSH 2
PUSH 3
ADD
PUSH 4
MUL
