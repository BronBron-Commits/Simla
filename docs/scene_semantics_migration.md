# Scene Semantics Migration Plan

## Problem

Simla currently uses plain lists for many different meanings:

- executable forms
- ordered arrays
- key/value property bags
- scene primitives
- scene groups and children
- tuples/vectors

Because all of these collapse to nested arrays at runtime, traversal and rendering become heuristic-driven and fragile.

## Current Risk Points

1. Parsing and compilation preserve list shape but not semantic intent.
2. Runtime GET/SET treat any array as key/value pairs.
3. Scene loaders parse arrays into objects by convention and string keys.
4. Flattening can erase hierarchy because there is no structural type boundary.

## Goal

Introduce explicit semantic kinds for runtime data while preserving backward compatibility for existing list-based programs.

## Target Runtime Value Model

Use explicit value kinds in the JS VM first:

- number
- string
- boolean
- function
- array
- object
- node
- tuple
- nil

For scene work, node is the key type.

## Node Shape

Node must encode intent directly:

- kind: transform | primitive | light | camera | group | custom
- props: object
- children: array of node

A primitive node is always kind=primitive with props.type holding cube/sphere/etc.

## Language Surface (Phase 1)

Add constructors that produce tagged runtime values:

- obj k1 v1 k2 v2 ...
- arr v1 v2 ...
- node kind props children
- vec3 x y z

Add accessors and predicates:

- getp object key
- setp object key value
- kind value
- is_node value
- children value

Keep existing list/get/set semantics as legacy behavior.

## Compiler and VM Strategy

1. Compiler:
- Add new opcodes for OBJ, ARR, NODE, VEC3, GETP, SETP.
- Keep LIST/GET/SET unchanged for compatibility.

2. JS VM:
- Introduce internal tagged wrappers for object/array/node/tuple.
- Make TYPE return distinct values (array/object/node/tuple/function/...).
- Restrict FLATTEN to array only.

3. C runtimes:
- Do not block JS migration on immediate C parity.
- Add feature gating so shared-bytecode tests keep passing.
- Plan C parity as a second milestone after JS semantics stabilize.

## Renderer Contract

Scene APIs should consume one canonical shape:

- scene root is node(kind=group)
- only node.children is traversed recursively
- object props are never traversed as child arrays

Legacy support adapter:

- If scene output is legacy list of primitive property-pairs, wrap into a root group node at load time.

This keeps old scenes running while enabling nested graph semantics immediately.

## Backward Compatibility Rules

1. Legacy list-based primitives continue to render.
2. Legacy get/set continue to work on key/value arrays.
3. New getp/setp operate only on object values.
4. Flattening legacy scene lists remains allowed, but flattening node trees is rejected.

## Migration Phases

Phase A: Introduce types and adapters

- Implement runtime kinds and new constructors in JS compiler/VM.
- Add renderer input adapter legacy -> node tree.
- Add TYPE tests for new kinds.

Phase B: Scene library migration

- Update scene helpers in lib to emit node/object/array values.
- Keep old helper variants under legacy names.

Phase C: Example migration

- Convert one procedural scene and one combat scene.
- Add snapshot tests for hierarchy-preserving traversal.

Phase D: C runtime parity

- Add equivalent tagged value representation or shared-bytecode extension.
- Gate tests by feature profile until complete.

## Minimum Test Additions

1. Nested transform hierarchy applies exactly once per level.
2. Primitive in props is not traversed as child list.
3. Children arrays are traversed; property objects are not.
4. Flatten on node returns error.
5. Legacy flat primitive list still renders.

## Suggested Immediate Code Touchpoints

- src/compiler.js: add constructors/accessors op emission.
- src/vm.js: add typed value runtime and op handlers.
- lib/simla3d.sim: add node-based scene helpers.
- serve.js and viewer loaders: add legacy-to-node adapter at scene boundary.

## Non-Goals

- Rewriting the parser.
- Removing legacy list semantics immediately.
- Full C parity in the first change.

## Success Criteria

1. Scene traversal has zero heuristic recursion over generic arrays.
2. Hierarchy is represented only by node.children.
3. Transform propagation is deterministic and test-covered.
4. Existing scenes still render through adapter mode.
