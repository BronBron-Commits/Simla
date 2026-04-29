import { run } from "../src/run.js";

const fn = {
  params: ["x"],
  body: [
    ["LOAD", "x"],
    ["PUSH", 2],
    ["MUL"],
    ["PUSH", 999] // should be ignored if not last
  ]
};

const program = [
  ["PUSH", [1]],
  ["PUSH", fn],
  ["MAP"]
];

const { result } = run(program);

// Expect last value → 999 (current behavior)
// OR change expectation if you later add RETURN opcode

if (JSON.stringify(result) !== JSON.stringify([999])) {
  console.log("Result:", result);
  throw new Error("Return semantics broken");
}

console.log("Return semantics OK");
