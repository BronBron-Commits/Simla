# Getting Started

Simla is easiest to approach in three steps: install it, run one tiny program, then open one stable demo.

## Install

```bash
git clone https://github.com/BronBron-Commits/Simla.git
cd Simla
npm install
```

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