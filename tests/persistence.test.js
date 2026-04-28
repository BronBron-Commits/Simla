import { run } from "../src/vm.js";

const bytecode = [
  ["LOAD", "x"],
  ["PUSH", 0],
  ["OR"],
  ["STORE", "x"],

  ["LOAD", "x"],
  ["PUSH", 1],
  ["ADD"],
  ["STORE", "x"],

  ["LOAD", "x"]
];

let state = {};

for (let i = 0; i < 5; i++) {
  const step = run(bytecode, state);
  state = step.state;

  console.log("frame", i, "x =", state.x);
}
