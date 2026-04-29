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
  (let fact
    (fn (n)
      (if (eq n 0)
        1
        (mul n (fact (sub n 1)))
      )
    )
  )

  (fact 5)
)
`;

const ast = parse(tokenize(code));
const bytecode = compile(ast);
const step = run(bytecode, {});

console.log(step.result);

if (step.result !== 120) {
  throw new Error("RECURSION failed: expected 120");
}
