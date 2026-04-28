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
  (let hp 10)
  (debug hp)
)
`;

const ast = parse(tokenize(code));
const bytecode = compile(ast);
const step = run(bytecode, {});

console.log("RESULT", step.result);

if (step.result !== 10) {
  throw new Error("DEBUG failed");
}
