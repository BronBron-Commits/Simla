# Simla Language Specification

Simla is a deterministic simulation language.

Its purpose is to describe rules that produce the same result across multiple runtimes:

- C interpreter
- C bytecode VM
- JavaScript VM
- future runtimes

Current spec version:

SIMLA_SPEC_VERSION = 0.1

## Stability Goal

A valid Simla program must produce the same result when executed by every conforming runtime.

same source + same input + same seed = same output

## Runtime Targets

A runtime is conforming when it passes every file in:

tests/spec/

against the expected output in:

tests/golden/

## Core Design Rules

1. Simla behavior must be deterministic.
2. Existing stable operations should not change silently.
3. Experimental operations must be documented separately.
4. Game-specific behavior belongs in Simla libraries, not the core language.
5. Every language feature needs at least one conformance test.

## Stable Core Operations

PUSH
LOAD
STORE
ADD
SUB
MUL
DIV
EQ
LT
GT
AND
OR
NOT
IF
MAP
RANGE
GET
SET

## Experimental Operations

GRID
NEIGHBORS
FLATTEN
PATHFIND
LOS

## Error Rules

Invalid programs should fail clearly.

Examples:

unknown operation
invalid type
wrong number of arguments
missing variable
out of range access

Silent failure is not allowed.
