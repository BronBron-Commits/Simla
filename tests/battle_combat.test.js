import { run } from "../src/vm.js";

function makeEntity(id, team, hp, attack) {
  return ["id", id, "team", team, "hp", hp, "attack", attack];
}

const entities = [];

for (let i = 0; i < 100; i++) {
  entities.push(makeEntity(i, "player", 20, 2));
}

for (let i = 0; i < 100; i++) {
  entities.push(makeEntity(100 + i, "enemy", 15, 1));
}

function get(e, key) {
  for (let i = 0; i < e.length; i += 2) {
    if (e[i] === key) return e[i + 1];
  }
  return 0;
}

function set(e, key, value) {
  const out = [...e];

  for (let i = 0; i < out.length; i += 2) {
    if (out[i] === key) {
      out[i + 1] = value;
      return out;
    }
  }

  out.push(key, value);
  return out;
}

function countTeam(list, team) {
  return list.filter(e => get(e, "team") === team && get(e, "hp") > 0).length;
}

function combatTick(list) {
  let next = list.map(e => [...e]);

  for (const attacker of list) {
    if (get(attacker, "hp") <= 0) continue;

    const attackerTeam = get(attacker, "team");
    const targetIndex = next.findIndex(target =>
      get(target, "team") !== attackerTeam &&
      get(target, "hp") > 0
    );

    if (targetIndex === -1) continue;

    const target = next[targetIndex];
    const newHp = get(target, "hp") - get(attacker, "attack");
    next[targetIndex] = set(target, "hp", newHp);
  }

  return next.filter(e => get(e, "hp") > 0);
}

const start = performance.now();

let step = run([["LOAD", "entities"]], { entities });

let state = entities;
let ticks = 0;

while (
  countTeam(state, "player") > 0 &&
  countTeam(state, "enemy") > 0 &&
  ticks < 1000
) {
  state = combatTick(state);
  ticks++;
}

const end = performance.now();

const players = countTeam(state, "player");
const enemies = countTeam(state, "enemy");

console.log({
  ticks,
  players,
  enemies,
  winner: players > 0 ? "players" : "enemies",
  ms: Math.round(end - start),
  sample: state[0] || null
});

if (players <= 0) {
  throw new Error("Expected players to win");
}

if (enemies !== 0) {
  throw new Error("Expected enemies defeated");
}
