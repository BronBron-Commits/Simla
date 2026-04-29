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

function get(e, k) {
  for (let i = 0; i < e.length; i += 2) {
    if (e[i] === k) return e[i + 1];
  }
  return 0;
}

function makeEntities() {
  const out = [];

  for (let i = 0; i < 100; i++) {
    out.push(["id", i, "team", "player", "hp", 20, "attack", 2]);
  }

  for (let i = 0; i < 100; i++) {
    out.push(["id", 100 + i, "team", "enemy", "hp", 15, "attack", 1]);
  }

  return out;
}

const tickCode = `
(begin
  (damage_all entities tick)
)
`;

const reportCode = `
(begin
  (battle_report entities ticks 2000 1500)
)
`;

const tickBytecode = compile(parse(tokenize(tickCode)));
const reportBytecode = compile(parse(tokenize(reportCode)));

let state = makeEntities();
let ticks = 0;

while (ticks < 1000) {
  const step = run(tickBytecode, { entities: state, tick: ticks });
  state = step.result;
  ticks++;

  const playersAlive = state.filter(e => get(e, "team") === "player").length;
  const enemiesAlive = state.filter(e => get(e, "team") === "enemy").length;

  if (playersAlive === 0 || enemiesAlive === 0) break;
}

const report = run(reportBytecode, {
  entities: state,
  ticks
}).result;

console.log(JSON.stringify(report, null, 2));

if (get(report, "winner") !== "players") {
  throw new Error("Expected players to win");
}

if (get(report, "enemiesAlive") !== 0) {
  throw new Error("Expected no enemies alive");
}

if (get(report, "playerDamageTaken") <= 0) {
  throw new Error("Expected players to take damage");
}
