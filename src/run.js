import * as vm from "./vm.js";

export function run(program, input = {}) {
  if (!program) throw new Error("No program provided");

  // Your VM likely already exposes a runner function
  // Try the known ones in order:

  if (typeof vm.run === "function") {
    return vm.run(program, input);
  }

  if (typeof vm.exec === "function") {
    return vm.exec(program, input);
  }

  throw new Error("No runnable VM entry found (run/exec)");
}
