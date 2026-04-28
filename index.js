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
let mouse = { x: 0, y: 0 };

window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
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
    mouseX: mouse.x,
    mouseY: mouse.y
  };

  const result = run(bytecode, globals);

  if (Array.isArray(result)) {
    render(result);
  }

  requestAnimationFrame(loop);
}

init();
