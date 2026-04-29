# Simla Values

Simla currently supports:

number
bool
list
state

## Number

Numbers are used for arithmetic, positions, ranges, combat values, terrain values, and counters.

## Bool

Booleans are used for conditionals and logical expressions.

true
false

## List

Lists are ordered collections.

List operations must preserve order unless explicitly documented otherwise.

## State

State is persistent runtime data.

A conforming runtime must define whether state persists:

within one program execution
across frames
across ticks
across calls

Current Simla direction:

state persists across frames/ticks unless explicitly reset
