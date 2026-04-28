import { tokenize } from "../src/tokenizer.js";
import { parse } from "../src/parser.js";
import { compile } from "../src/compiler.js";
import { run } from "../src/vm.js";

function test(code, expected, name) {
  const ast = parse(tokenize(code));
  const bc = compile(ast);
  const result = run(bc, {});

  const ok = JSON.stringify(result) === JSON.stringify(expected);
  console.log(ok ? "PASS" : "FAIL", "-", name);
}

// full pipeline
test("(add 2 3)", 5, "math");
test("(list 1 2 3)", [1,2,3], "list");
test("(begin (let x 5) (add x 2))", 7, "state");
