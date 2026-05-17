Simλ (Simla)

A deterministic simulation language for games and systems.

Simla lets you define simulation logic once and run it across multiple runtimes with identical results.

<img width="904" height="448" alt="1000008470" src="https://github.com/user-attachments/assets/8a86f4c5-c654-4a95-afbf-886eac4cb0e4" />
<img width="1860" height="895" alt="1000008472" src="https://github.com/user-attachments/assets/889eeb66-8543-4dfa-b320-62f37de2dfe4" />
<img width="1845" height="948" alt="1000008473" src="https://github.com/user-attachments/assets/9da85688-aa88-45db-9924-7a11ded2111b" />



# Simla

A deterministic simulation language for games and systems.

Simla is an experimental programming language, compiler, and bytecode VM focused on simulations, gameplay logic, and interactive 3D runtime systems.

The project explores a complete pipeline from:

Simla source code → parser/compiler → bytecode → VM → interactive scenes

Simla programs can run across multiple runtimes with consistent behavior, including JavaScript and experimental C runtimes.

## Features

* Custom parser, compiler, and bytecode VM
* Deterministic runtime experiments
* JavaScript and C runtime implementations
* Browser-based 3D rendering and simulation demos
* ECS-like runtime systems and simulation logic
* Self-hosting compiler experiments
* Tactical arena, voxel world, and simulation viewers

## Demo Scenes

### Voxel World Runtime

Interactive voxel and terrain experiments rendered in the browser.

### Library Simulation

3D library environment with animated books, interaction systems, and runtime-generated scenes.

### Simulation Scenes

Large-scale scene rendering, AI experiments, runtime-driven entities, and environmental systems.

## Quick Start

Clone the repository:

```bash
git clone https://github.com/BronBron-Commits/Simla.git
```

Enter the project directory:

```bash
cd Simla
```

Install dependencies:

```bash
npm install
```

Run validation checks:

```bash
npm run check
npm run conformance
npm run errors
```

Start the local server:

```bash
node serve.js
```

Open in browser:

```text
http://localhost:8080/
```

Example pages:

```text
http://localhost:8080/sim3d.html
http://localhost:8080/voxel_world.html
http://localhost:8080/static/library_viewer.html
http://localhost:8080/simla3d_first_person.html
```

## Repository Structure

src/
Parser, compiler, VM, and runtime systems.

examples/
Simla programs and runtime examples.

static/
Browser viewers, generated assets, and scene tools.

c-simla/
Experimental C runtime and parity tests.

spec/
Language notes, opcode behavior, determinism, and conformance documentation.

tools/
Testing utilities, exporters, runners, and helper scripts.

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

## Contributing

Contributions, experiments, bug reports, and ideas are welcome.

See CONTRIBUTING.md for setup instructions and contribution guidelines.

## Project Status

Simla is experimental and evolving rapidly.

Some systems are stable enough for demonstrations and experimentation, while others are still active research and development areas.

## License

MIT License
