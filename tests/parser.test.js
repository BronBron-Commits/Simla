import { tokenize } from "../src/tokenizer.js";
import { parse } from "../src/parser.js";

function test(code, name) {
  try {
    const tokens = tokenize(code);
    const ast = parse(tokens);
    console.log("PASS -", name);
    console.log(JSON.stringify(ast, null, 2));
  } catch (e) {
    console.log("FAIL -", name);
    console.error(e.message);
  }
}

// atoms
test("42", "number");
test("x", "symbol");

// simple list
test("(+ 1 2)", "simple list");

// nested
test("(+ (* 2 3) 4)", "nested");

// empty
test("()", "empty list");

// deep nesting
test("(a (b (c (d 1))))", "deep nesting");

// decimals + negatives
test("(- 3.5 -2)", "numbers edge");
