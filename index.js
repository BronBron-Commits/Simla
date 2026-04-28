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
let state = {};

const keys = {};

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = 1);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = 0);

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

  let result;

  while (accumulator >= FIXED_DT) {

    const step = run(bytecode, {
      ...state,
      keyw: keys["w"] || 0,
      keya: keys["a"] || 0,
      keys: keys["s"] || 0,
      keyd: keys["d"] || 0
    });

    // 🔥 CRITICAL: merge, don't replace blindly
    state = { ...state, ...step.state };

    result = step.result;

    accumulator -= FIXED_DT;
  }

  const commands = Array.isArray(result?.[0]) ? result : [result];

  render(ctx, commands);

  requestAnimationFrame(loop);
}

init();
