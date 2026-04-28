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
  (let entities
    (list
      (list "x" 1 "alive" 1)
      (list "x" 2 "alive" 0)
      (list "x" 3 "alive" 1)
    )
  )

  (let entities
    (filter
      (fn (e) (get e "alive"))
      entities
    )
  )

  entities
)
`;

const ast = parse(tokenize(code));
const bytecode = compile(ast);
const step = run(bytecode, {});

console.log(JSON.stringify(step.result));

if (step.result.length !== 2) {
  throw new Error("FILTER failed: expected 2 live entities");
}
