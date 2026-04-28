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

let bytecode;

async function init() {
  const res = await fetch("./examples/test.mc");
  const code = await res.text();

  const tokens = tokenize(code);
  const ast = parse(tokens);
  bytecode = compile(ast);

  console.log("BYTECODE:", bytecode);

  requestAnimationFrame(loop);
}

function loop(t) {
  // inject time (seconds)
  const result = runWithTime(bytecode, t / 1000);

  if (Array.isArray(result)) {
    render(result);
  }

  requestAnimationFrame(loop);
}

// simple hook: extend VM env with time
function runWithTime(bytecode, time) {
  return run(bytecode, { time });
}

init();
