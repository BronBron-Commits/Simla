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
    out.push(["id", i, "team", "player", "hp", 20, "maxHp", 20, "attack", 2]);
  }

  for (let i = 0; i < 100; i++) {
    out.push(["id", 100 + i, "team", "enemy", "hp", 15, "maxHp", 15, "attack", 1]);
  }

  return out;
}

const code = `
(begin
  (let e entities)
  (let t tick)
  (damage_all e t)
)
`;

const ast = parse(tokenize(code));
const bytecode = compile(ast);

let state = makeEntities();
let ticks = 0;

const start = performance.now();

while (ticks < 1000) {
  const step = run(bytecode, { entities: state, tick: ticks });
  state = step.result;
  ticks++;

  const playersAlive = state.filter(e => get(e, "team") === "player").length;
  const enemiesAlive = state.filter(e => get(e, "team") === "enemy").length;

  if (playersAlive === 0 || enemiesAlive === 0) break;
}

const end = performance.now();

const players = state.filter(e => get(e, "team") === "player");
const enemies = state.filter(e => get(e, "team") === "enemy");

const playerHp = players.reduce((sum, e) => sum + get(e, "hp"), 0);
const enemyHp = enemies.reduce((sum, e) => sum + get(e, "hp"), 0);

const initialPlayerHp = 100 * 20;
const initialEnemyHp = 100 * 15;

const report = {
  ticks,
  winner: players.length > 0 ? "players" : "enemies",
  playersAlive: players.length,
  enemiesAlive: enemies.length,
  playerHpRemaining: playerHp,
  enemyHpRemaining: enemyHp,
  playerDamageTaken: initialPlayerHp - playerHp,
  enemyDamageTaken: initialEnemyHp - enemyHp,
  runtimeMs: Math.round(end - start)
};

console.log(JSON.stringify(report, null, 2));

if (report.winner !== "players") {
  throw new Error("Expected players to win");
}

if (report.enemiesAlive !== 0) {
  throw new Error("Expected no enemies alive");
}

if (report.playerDamageTaken <= 0) {
  throw new Error("Expected players to take damage");
}
