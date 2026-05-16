# Contributing to Simla

Thank you for your interest in contributing to Simla.

Simla is an experimental programming language, bytecode VM, and simulation/rendering playground focused on game logic, interactive scenes, and runtime experimentation.

The project is evolving quickly, so contributions, bug reports, experiments, and ideas are welcome.

## Getting Started

Clone the repository:

git clone https://github.com/BronBron-Commits/minicompiler.git

Enter the project directory:

cd minicompiler

Install dependencies:

npm install

Start the local development server:

node serve.js

Open the demos in your browser:

http://localhost:8080/sim3d.html

http://localhost:8080/simla3d_viewer.html

http://localhost:8080/static/library_viewer.html

## Project Structure

src/
JavaScript parser, compiler, VM, and runtime logic.

examples/
Simla programs, demos, and experiments.

static/
Browser viewers, generated assets, and visual tools.

c-simla/
Experimental C implementation and parity tests.

spec/
Language notes, VM behavior, and conformance documentation.

tools/
Exporters, runners, and utility scripts.

## Contribution Guidelines

Small focused pull requests are preferred.

Before making major architectural changes, please open an issue or discussion describing the proposal.

When possible:

* Keep changes isolated and easy to review
* Avoid unrelated formatting changes
* Add tests for VM/compiler behavior
* Include reproduction steps for bug fixes

## Reporting Bugs

Please include:

* Operating system
* Browser or runtime version
* Exact command used
* Error logs or stack traces
* Minimal reproduction example

## Experimental Areas

Some parts of Simla are highly experimental and may change frequently:

* Self-hosting compiler work
* 3D rendering experiments
* ECS/runtime systems
* Voxel and world-generation systems
* Shader and post-processing systems

Contributors should expect APIs and bytecode behavior in these areas to evolve.

## Style Notes

* Prefer readable code over clever code
* Keep VM operations explicit
* Minimize hidden behavior
* Keep language/runtime semantics deterministic where possible

## Testing

Run JavaScript tests:

npm test

Run C VM tests:

cd c-simla

make

./run_tests.sh

## Community

Be respectful and constructive in issues and pull requests.

The goal of Simla is experimentation, learning, and building interesting systems together.
