# Rendering Notes

Simla separates deterministic simulation state from presentation.

The language and runtime compute scene data, while the browser viewers decide how to draw and animate it.

## Stable Starting Points

* `sim3d.html` for general scene experimentation
* `simla3d_first_person.html` for first-person exploration
* `rwx_viewer.html` for RWX model inspection
* `voxel_world.html` for terrain and voxel work

## Scene Shape

Many scene programs return a structure with keys like:

* `camera`
* `background`
* `render`
* `objects`

`examples/first_scene.sim` and `examples/cube_scene.sim` are good references for that shape.

## Determinism Boundary

Keep simulation truth inside Simla and keep interpolation or presentation smoothing inside the renderer. That preserves easier replay, debugging, and cross-runtime parity.