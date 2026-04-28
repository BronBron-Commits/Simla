import { tokenize } from "../src/tokenizer.js";
import { parse } from "../src/parser.js";
import { compile } from "../src/compiler.js";
import { run } from "../src/vm.js";

const code = "(begin (let x (or x 0)) (let x (add x 1)) x)";
const ast = parse(tokenize(code));
const bc = compile(ast);

const results = [];

for (let i = 0; i < 5; i++) {
  const { result } = run(bc, {});
  results.push(result);
}

const allSame = results.every(r => r === results[0]);

console.log(allSame ? "PASS" : "FAIL", "determinism");
console.log(results);
