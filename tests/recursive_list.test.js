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
  (let length
    (fn (xs)
      (if (empty xs)
        0
        (add 1 (length (slice xs 1)))
      )
    )
  )

  (length (list 10 20 30 40 50))
)
`;

const ast = parse(tokenize(code));
const bytecode = compile(ast);
const step = run(bytecode, {});

console.log(step.result);

if (step.result !== 5) {
  throw new Error("RECURSIVE LIST failed: expected 5");
}
