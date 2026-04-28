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
  (let team "enemy")
  (list
    (gt hp 0)
    (lt hp 5)
    (eq team "enemy")
  )
)
`;

const ast = parse(tokenize(code));
const bytecode = compile(ast);
const step = run(bytecode, {});

console.log(JSON.stringify(step.result));

if (JSON.stringify(step.result) !== JSON.stringify([true, false, true])) {
  throw new Error("COMPARE failed");
}
