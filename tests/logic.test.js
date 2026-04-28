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
  (let dead 0)
  (list
    (and (gt hp 0) (not dead))
    (and (lt hp 0) (not dead))
    (not (eq hp 5))
  )
)
`;

const ast = parse(tokenize(code));
const bytecode = compile(ast);
const step = run(bytecode, {});

console.log(JSON.stringify(step.result));

if (JSON.stringify(step.result) !== JSON.stringify([true, false, true])) {
  throw new Error("LOGIC failed");
}
