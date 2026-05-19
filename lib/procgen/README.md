# Simla Procedural Generation Architecture

Goal:
Move from manually-authored geometry
to parameterized procedural systems.

Core idea:

primitive
  -> transform
  -> generator
  -> world

Required VM/runtime features:

- range
- map
- flatten
- append
- sin
- cos
- vector math
- generators
- repeat
- recursion helpers

Target architecture:

(spiral-staircase
  radius
  steps
  rise
  angleStep
)

(build-wall
  start
  end
  height
)

(generate-terrain
  width
  depth
  noiseScale
)

Scene generation should become:
rules -> geometry

instead of:
manual object placement.
