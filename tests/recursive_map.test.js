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
  (let mapR
    (fn (f xs)
      (if (empty xs)
        emptyList
        (concat
          (list (f (nth xs 0)))
          (mapR f (slice xs 1))
        )
      )
    )
  )

  (mapR (fn (x) (mul x 2)) (list 1 2 3 4))
)
`;

const ast = parse(tokenize(code));
const bytecode = compile(ast);
const step = run(bytecode, { emptyList: [] });

console.log(step.result);

if (JSON.stringify(step.result) !== JSON.stringify([2,4,6,8])) {
  throw new Error("RECURSIVE MAP failed");
}
