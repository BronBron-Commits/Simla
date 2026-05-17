Simλ (Simla)

A deterministic simulation language for games and systems.

Simla lets you define simulation logic once and run it across multiple runtimes with identical results.

<img width="904" height="448" alt="1000008470" src="https://github.com/user-attachments/assets/8a86f4c5-c654-4a95-afbf-886eac4cb0e4" />
<img width="1860" height="895" alt="1000008472" src="https://github.com/user-attachments/assets/889eeb66-8543-4dfa-b320-62f37de2dfe4" />
<img width="1845" height="948" alt="1000008473" src="https://github.com/user-attachments/assets/9da85688-aa88-45db-9924-7a11ded2111b" />



Simla is an experimental programming language, compiler, and bytecode VM focused on simulations, gameplay logic, and interactive 3D runtime systems.

The project explores a complete pipeline from:

Simla source code → parser/compiler → bytecode → VM → interactive scenes

Simla programs can run across multiple runtimes with consistent behavior, including JavaScript and experimental C runtimes.

## Quick Start

Clone the repository:

```bash
git clone https://github.com/BronBron-Commits/Simla.git
cd Simla
npm install
```

Common entrypoints:

```bash
npm run serve
npm test
npm run simla -- examples/hello.sim
```

Open the local server at:

```text
http://localhost:8080/
```

## Features

* Custom parser, compiler, and bytecode VM
* Deterministic runtime experiments
* JavaScript and C runtime implementations
* Browser-based 3D rendering and simulation demos
* ECS-like runtime systems and simulation logic
* Self-hosting compiler experiments
* Tactical arena, voxel world, and simulation viewers

## Your First Simla Program

Start with a program that simply evaluates to a string:

```lisp
(begin
	"Hello from Simla"
)
```

Run it with:

```bash
npm run simla -- examples/hello.sim
```

Then try a minimal scene program:

```bash
npm run simla -- examples/first_scene.sim
```

That second example returns a scene-shaped data structure that can be used as a stepping stone toward the browser viewers.

## Stable Demos

If you are opening Simla for the first time, start here:

* `http://localhost:8080/voxel_world.html` for the voxel and terrain runtime
* `http://localhost:8080/sim3d.html` for the browser simulation sandbox
* `http://localhost:8080/rwx_viewer.html` for RWX model inspection
* `http://localhost:8080/simla3d_first_person.html` for the first-person scene viewer

Other pages in the repo are still useful, but many are active experiments rather than stable starting points.

## Demo Scenes

### Voxel World Runtime

Interactive voxel and terrain experiments rendered in the browser.

### Library Simulation

3D library environment with animated books, interaction systems, and runtime-generated scenes.

### Simulation Scenes

Large-scale scene rendering, AI experiments, runtime-driven entities, and environmental systems.

## Repository Structure

src/
Parser, compiler, VM, and runtime systems.

examples/
Simla programs and runtime examples.

docs/
Getting-started notes, runtime guidance, and language documentation.

c-simla/
Experimental C runtime and parity tests.

spec/
Language notes, opcode behavior, determinism, and conformance documentation.

tools/
Testing utilities, exporters, runners, and helper scripts.

## Starter Docs

For a guided pass through the project, start with:

* [docs/getting_started.md](c:/Projects/Simla/docs/getting_started.md)
* [docs/runtime.md](c:/Projects/Simla/docs/runtime.md)
* [docs/language.md](c:/Projects/Simla/docs/language.md)
* [docs/rendering.md](c:/Projects/Simla/docs/rendering.md)
* [docs/roadmap.md](c:/Projects/Simla/docs/roadmap.md)

## Runtime Goals

Simla explores:

* deterministic runtime execution
* portable simulation logic
* runtime parity between implementations
* interactive browser-driven simulations
* game and ECS-oriented scripting systems
* self-hosting language experimentation

## Testing

Run general validation:

```bash
npm run check
```

Run conformance tests:

```bash
npm run conformance
```

Run error behavior tests:

```bash
npm run errors
```

Run the full default validation bundle:

```bash
npm test
```

## Contributing

Contributions, experiments, bug reports, and ideas are welcome.

See CONTRIBUTING.md for setup instructions and contribution guidelines.

## Project Status

Simla is experimental and evolving rapidly.

Some systems are stable enough for demonstrations and experimentation, while others are still active research and development areas.

## Roadmap Snapshot

Near-term focus:

* onboarding improvements
* runtime stability and parity
* mobile support and browser polish
* deterministic replay tooling

Mid-term focus:

* ECS runtime systems
* networking experiments
* stronger developer tooling
* asset pipeline cleanup

Long-term direction:

* self-hosting compiler work
* standalone runtime packaging
* multiplayer simulation support

## License

MIT License
