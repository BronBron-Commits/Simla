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
  (flatten
    (list
      (range 0 3)
      (range 3 6)
    )
  )
)
`;

const ast = parse(tokenize(code));
const bytecode = compile(ast);
const step = run(bytecode, {});

console.log(step.result);

if (JSON.stringify(step.result) !== JSON.stringify([0,1,2,3,4,5])) {
  throw new Error("range/flatten failed");
}
