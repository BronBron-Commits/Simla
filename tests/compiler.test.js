import { tokenize } from "../src/tokenizer.js";
import { parse } from "../src/parser.js";
import { compile } from "../src/compiler.js";

function assertHas(bytecode, op, name) {
  const found = bytecode.some(([o]) => o === op);
  console.log(found ? "PASS" : "FAIL", "-", name);
}

function test(code, expectedOps, name) {
  const ast = parse(tokenize(code));
  const bc = compile(ast);

  console.log("\nTEST:", name);
  console.log("BYTECODE:", bc);

  for (const op of expectedOps) {
    assertHas(bc, op, name + " contains " + op);
  }
}

// math
test("(add 1 2)", ["PUSH", "ADD"], "add");

// variables
test("(let x 5)", ["STORE"], "let");

// nested math
test("(add (mul 2 3) 4)", ["MUL", "ADD"], "nested");

// list
test("(list 1 2 3)", ["LIST"], "list");

// state
test("(begin (let x 5) (add x 1))", ["STORE", "LOAD", "ADD"], "state flow");
