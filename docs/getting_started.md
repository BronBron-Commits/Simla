# Getting Started

Simla is easiest to approach in three steps: install it, run one tiny program, then open one stable demo.

## Install

```bash
git clone https://github.com/BronBron-Commits/Simla.git
cd Simla
npm install
```

On Windows, you can use the installer instead:

```powershell
.\install_windows.cmd
```

That script checks for Node.js, optionally runs `npm install`, and creates `simla-run.cmd`, `simla-serve.cmd`, and `simla-repl.cmd`.

## Run Your First Program

```bash
npm run simla -- examples/hello.sim
```

Expected output:

```text
Hello from Simla
```

## Start The Local Server

```bash
npm run serve
```

Windows launcher:

```powershell
.\simla-serve.cmd
```

Then open one of these pages:

* `http://localhost:8080/voxel_world.html`
* `http://localhost:8080/sim3d.html`
* `http://localhost:8080/rwx_viewer.html`
* `http://localhost:8080/simla3d_first_person.html`

## Run Validation

```bash
npm test
```

If you want narrower checks, use `npm run check`, `npm run conformance`, or `npm run errors`.