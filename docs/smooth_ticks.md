Smooth Ticks in Simla

Core Idea

Simla should keep the simulation state deterministic and easy to inspect.

The simulation stays discrete:
citizen tile 2 -> tile 3 -> tile 4

The renderer makes it look smooth:
visual position 2.0 -> 2.1 -> 2.2 -> ... -> 3.0

Rule

Simla owns truth.
Renderer owns presentation.

Discrete Sim State

Example:
(list
  "id" 1
  "type" "citizen"
  "tile" 2
  "home" 2
  "job" 16
  "mode" "afternoon"
)

Next tick:
(list
  "id" 1
  "type" "citizen"
  "tile" 3
  "home" 2
  "job" 16
  "mode" "afternoon"
)

This is easy to read, test, replay, and compare.

Smooth Viewer State

The viewer keeps separate visual state:

visuals[id] = {
  fromTile: 2,
  toTile: 3,
  t: 0
}

Every animation frame:

t += 0.025
visualTile = lerp(fromTile, toTile, smoothstep(t))

So the sim still snaps, but the viewer glides.

Why Not Floating Positions Yet

Floating positions inside Simla would look like:

"x" 2.35
"targetX" 3.0
"speed" 0.15

That works, but it adds problems:

arrival thresholds
float drift
cross-runtime parity issues
harder debugging
harder replay comparison

For now, tile steps are cleaner.

Future Hybrid Model

Later, Simla can expose intent without going full physics:

(list
  "id" 1
  "tile" 2
  "targetTile" 3
  "moveProgress" 0.35
)

That lets Simla own animation timing while staying deterministic.

Current Best Pattern

Simla:
tick -> next tile / next state / events

Viewer:
detect tile changes
interpolate visuals
draw smooth movement

Summary

Use discrete simulation for truth:
tile=2
tile=3
tile=4

Use smooth interpolation for visuals:
visualTile=2.0...3.0...4.0

Result:
easy debugging
deterministic replay
clean renderer freedom
smooth visuals
