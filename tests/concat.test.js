import { parse } from "../src/parser.js";
import { compile } from "../src/compiler.js";
import { run } from "../src/vm.js";

function tokenize(code) {
  return code
    .replace(/;;.*$/gm, "")
    .replace(/\(/g, " ( ")
    .replace(/\)/g, " ) ")
    .match(/"[^"]*"|\S+/g);
}

const code = `
(begin
  (let a (list 1 2))
  (let b (list 3 4))
  (concat a b)
)
`;

const ast = parse(tokenize(code));
const bytecode = compile(ast);
const step = run(bytecode, {});

console.log(JSON.stringify(step.result));

if (JSON.stringify(step.result) !== JSON.stringify([1,2,3,4])) {
  throw new Error("CONCAT failed");
}
