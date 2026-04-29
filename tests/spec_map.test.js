import { run } from "../src/run.js";

const doubleFn = {
  params: ["x"],
  body: [
    ["LOAD", "x"],  // ← pull x onto stack
    ["PUSH", 2],
    ["MUL"]
  ]
};

const program = [
  ["PUSH", [1,2,3]],
  ["PUSH", doubleFn],
  ["MAP"]
];

const { result } = run(program);

if (JSON.stringify(result) !== JSON.stringify([2,4,6])) {
  console.log("Result:", result);
  throw new Error("MAP spec violation");
}

console.log("MAP spec OK");
