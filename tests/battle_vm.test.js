import { compile } from "../src/compiler.js";
import { parse } from "../src/parser.js";
import { run } from "../src/vm.js";

function tokenize(code) {
  return code
    .replace(/;;.*$/gm, "")
    .replace(/\(/g, " ( ")
    .replace(/\)/g, " ) ")
    .match(/"[^"]*"|\S+/g);
}

const makeEntities = () => {
  const out = [];
  for (let i = 0; i < 100; i++) {
    out.push(["id", i, "team", "player", "hp", 20, "attack", 2]);
  }
  for (let i = 0; i < 100; i++) {
    out.push(["id", 100 + i, "team", "enemy", "hp", 15, "attack", 1]);
  }
  return out;
};

const code = `
(begin
  (let e entities)
  (let t tick)
  (let e (damage_all e t))
  e
)
`;

const ast = parse(tokenize(code));
const bytecode = compile(ast);

let state = makeEntities();
let ticks = 0;

const start = performance.now();

while (ticks < 20) {
  const step = run(bytecode, { entities: state, tick: ticks });
  state = step.result;
  ticks++;
  if (!state.length) break;
}

const end = performance.now();

const get = (e, k) => {
  for (let i = 0; i < e.length; i += 2) if (e[i] === k) return e[i + 1];
  return 0;
};

const players = state.filter(e => get(e, "team") === "player").length;
const enemies = state.filter(e => get(e, "team") === "enemy").length;

console.log({
  ticks,
  players,
  enemies,
  winner: players > 0 ? "players" : "enemies",
  ms: Math.round(end - start),
  sample: state[0] || null
});

if (enemies !== 0) {
  throw new Error("Expected enemies defeated (VM)");
}
