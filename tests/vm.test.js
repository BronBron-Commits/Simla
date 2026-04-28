import { run } from "../src/vm.js";

function test(bytecode, expected, name) {
  const result = run(bytecode, {});
  const ok = JSON.stringify(result) === JSON.stringify(expected);

  console.log(ok ? "PASS" : "FAIL", "-", name);
  if (!ok) {
    console.log("Expected:", expected);
    console.log("Got     :", result);
  }
}

// arithmetic
test([
  ["PUSH", 2],
  ["PUSH", 3],
  ["ADD"]
], 5, "ADD");

// subtraction
test([
  ["PUSH", 5],
  ["PUSH", 2],
  ["SUB"]
], 3, "SUB");

// list
test([
  ["PUSH", 1],
  ["PUSH", 2],
  ["LIST", 2]
], [1,2], "LIST");

// variables
test([
  ["PUSH", 10],
  ["STORE", "x"],
  ["LOAD", "x"]
], 10, "LOAD/STORE");
