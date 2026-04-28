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
const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = 1;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = 0;
});

async function init() {
  const res = await fetch("./examples/test.mc");
  const code = await res.text();

  const tokens = tokenize(code);
  const ast = parse(tokens);
  bytecode = compile(ast);

  requestAnimationFrame(loop);
}

function loop(t) {
  const globals = {
    time: t / 1000,
    keyW: keys["w"] || 0,
    keyA: keys["a"] || 0,
    keyS: keys["s"] || 0,
    keyD: keys["d"] || 0
  };

  const result = run(bytecode, globals);

  if (Array.isArray(result)) {
    render(result);
  }

  requestAnimationFrame(loop);
}

init();
