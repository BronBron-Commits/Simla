import { run, GLOBAL_STATE } from "./src/vm.js";
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

// 🔥 persistent state (do NOT recreate each frame)
let state = { x: 400, y: 100, vx: 0, vy: 0 };

const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = 1);
window.addEventListener("keyup",   e => keys[e.key.toLowerCase()] = 0);

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

function loop() {
  // run with previous state + inputs
  const result = run(bytecode, {
    ...state,
    keyW: keys["w"] || 0,
    keyA: keys["a"] || 0,
    keyS: keys["s"] || 0,
    keyD: keys["d"] || 0
  });

  // 🔥 pull updated values back out
  state = { ...state, ...GLOBAL_STATE };

  // normalize to list-of-commands
  const commands = Array.isArray(result?.[0]) ? result : [result];
  render(ctx, commands);

  requestAnimationFrame(loop);
}

init();
