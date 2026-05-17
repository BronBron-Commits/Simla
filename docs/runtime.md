# Runtime Overview

Simla currently centers on a shared language surface with multiple runtime experiments:

* JavaScript VM for everyday development and browser integration
* C interpreter for native parity work
* C bytecode VM for lower-level execution experiments

## Main Entry Points

* `tools/run_js_vm.js` runs a `.sim` file through the JavaScript tokenizer, parser, compiler, and VM
* `serve.js` hosts browser demos and scene endpoints
* `c-simla/` contains the native runtime and parity tooling

## Runtime Goal

The project aims for identical observable behavior across runtimes for stable language features.

That means the same source program should produce the same result whether it runs in the JS VM, the C interpreter, or the C bytecode path.

## Validation Commands

```bash
npm run check
npm run conformance
npm run errors
```

Use `npm test` to run the default bundle.