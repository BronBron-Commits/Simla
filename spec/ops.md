# Simla Operations

This file defines the stable operation surface.

## Arithmetic

ADD
SUB
MUL
DIV

Arithmetic operations accept numbers.

## Boolean

AND
OR
NOT
EQ
LT
GT

Boolean operations must return true or false.

## State

LOAD
STORE
GET
SET

State operations read and write named values.

## Collection

MAP
RANGE

MAP applies a rule to each item in a list.

RANGE creates an ordered numeric sequence.

## Control Flow

IF

IF selects between two branches based on a boolean condition.

## Stability Rule

Once an operation is stable, changing its behavior requires a spec version bump.
