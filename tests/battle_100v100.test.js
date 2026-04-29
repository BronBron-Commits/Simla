import { run } from "../src/vm.js";

const entities = [];

for (let i = 0; i < 100; i++) {
  entities.push(["id", i, "team", "player", "hp", 10, "x", i, "alive", 1]);
}

for (let i = 0; i < 100; i++) {
  entities.push(["id", 100 + i, "team", "enemy", "hp", 10, "x", i, "alive", 1]);
}

const updateBytecode = [
  ["LOAD", "entities"],
  ["FN", ["e"], [
    ["LOAD", "e"],
    ["PUSH", "hp"],
    ["LOAD", "e"],
    ["PUSH", "hp"],
    ["GET"],
    ["PUSH", 1],
    ["SUB"],
    ["SET"]
  ]],
  ["MAP"],
  ["STORE", "entities"],

  ["LOAD", "entities"],
  ["FN", ["e"], [
    ["LOAD", "e"],
    ["PUSH", "hp"],
    ["GET"],
    ["PUSH", 0],
    ["GT"]
  ]],
  ["FILTER"],
  ["STORE", "entities"],

  ["LOAD", "entities"]
];

const start = performance.now();

let step = run([["LOAD", "entities"]], { entities });

for (let tick = 0; tick < 10; tick++) {
  step = run(updateBytecode, {});
}

const end = performance.now();

console.log({
  remaining: step.result.length,
  ms: Math.round(end - start),
  sample: step.result[0] || null
});

if (step.result.length !== 0) {
  throw new Error("Expected all entities dead after 10 damage ticks");
}
