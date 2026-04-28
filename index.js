import { run } from "./src/vm.js";
import { compile } from "./src/compiler.js";
import { parse } from "./src/parser.js";
import { render } from "./renderer.js";

function tokenize(code) {
  return code
    .replace(/;;.*$/gm, "")
    .replace(/\(/g, " ( ")
    .replace(/\)/g, " ) ")
    .match(/"[^"]*"|\S+/g);
}

let bytecode;
let ctx;

// 🔥 persistent state (correct way)
let state = { x: 400, y: 100, vx: 0, vy: 0 };

const FIXED_DT = 16;
let accumulator = 0;
let lastTime = 0;

async function init() {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  document.body.appendChild(canvas);

  ctx = canvas.getContext("2d");

  const code = await (await fetch("./examples/test.mc")).text();
  const ast = parse(tokenize(code));
  bytecode = compile(ast);

  requestAnimationFrame(loop);
}

function loop(time) {
  const dt = time - lastTime;
  lastTime = time;
  accumulator += dt;

  while (accumulator >= FIXED_DT) {
    const { state: nextState } = run(bytecode, state);
    state = nextState;
    accumulator -= FIXED_DT;
  }

  const commands = [
    ["circle", state.x, state.y, 20, 255, 0, 0]
  ];

  render(ctx, commands);

  requestAnimationFrame(loop);
}

init();
