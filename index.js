import { run } from "./src/vm.js";
import { compile } from "./src/compiler.js";
import { parse } from "./src/parser.js";
import { render } from "./renderer.js";

function tokenize(code) {
  return code
    .replace(/\(/g, " ( ")
    .replace(/\)/g, " ) ")
    .match(/"[^"]*"|\S+/g);
}

async function main() {
  const res = await fetch("./examples/test.mc");
  const code = await res.text();

  const tokens = tokenize(code);

  const ast = parse(tokens);
  const bytecode = compile(ast);

  console.log("BYTECODE:", bytecode);

  const result = run(bytecode);

  if (Array.isArray(result)) {
    render(result);
  } else {
    console.log("Result:", result);
  }
}

main();
