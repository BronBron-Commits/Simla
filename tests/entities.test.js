import { run } from "../src/vm.js";

const bytecode = [
  // entities = entities OR [["x",0]]
  ["LOAD", "entities"],

  ["PUSH", "x"],
  ["PUSH", 0],
  ["LIST", 2],

  ["LIST", 1],

  ["OR"],
  ["STORE", "entities"],

  // update
  ["LOAD", "entities"],
  ["FN", ["e"], [
    ["LOAD", "e"],
    ["PUSH", "x"],
    ["GET"],

    ["PUSH", 1],
    ["ADD"],

    ["STORE", "_tmp"],

    ["LOAD", "e"],
    ["PUSH", "x"],
    ["LOAD", "_tmp"],
    ["SET"]
  ]],
  ["MAP"],
  ["STORE", "entities"],

  ["LOAD", "entities"]
];

let state = {};

for (let i = 0; i < 5; i++) {
  const step = run(bytecode, state);
  state = step.state;

  console.log("frame", i, JSON.stringify(state.entities));
}
