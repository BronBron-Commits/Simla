import { parse } from "../src/parser.js";
import { compile } from "../src/compiler.js";
import { run } from "../src/vm.js";
import fs from "fs";

function tokenize(code) {
  return code
    .replace(/;;.*$/gm, "")
    .replace(/\(/g, " ( ")
    .replace(/\)/g, " ) ")
    .match(/"[^"]*"|\S+/g);
}

function get(list, key, fallback = undefined) {
  if (!Array.isArray(list)) return fallback;
  for (let i = 0; i < list.length; i += 2) {
    if (list[i] === key) return list[i + 1];
  }
  return fallback;
}

function parseAction(arg) {
  const [type, raw] = arg.split(":");

  if (type === "move") {
    return {
      actionType: "move",
      actorId: 1,
      targetId: 0,
      actionTile: Number(raw || 0)
    };
  }

  if (type === "attack") {
    return {
      actionType: "attack",
      actorId: 1,
      targetId: Number(raw || 2),
      actionTile: 0
    };
  }

  return {
    actionType: type,
    actorId: 1,
    targetId: 0,
    actionTile: Number(raw || 0)
  };
}

const file = "examples/combat_loop_entities.sim";
const code = fs.readFileSync(file, "utf8");
const ast = parse(tokenize(code));
const bytecode = compile(ast);

let state = [
  "round", 1,
  "entities", [
    ["id", 1, "team", "player", "hp", 20, "tile", 7, "attack", 4, "move", 3, "dead", 0],
    ["id", 2, "team", "enemy", "hp", 15, "tile", 10, "attack", 3, "move", 2, "dead", 0]
  ]
];

const actions = process.argv.slice(2);

if (actions.length === 0) {
  console.log("Usage:");
  console.log("  node tools/run_combat_entities.js move:8 end:0 attack:2 end:0");
  process.exit(0);
}

for (let i = 0; i < actions.length; i++) {
  const action = parseAction(actions[i]);

  const result = run(bytecode, {
    state,
    ...action
  }).result;

  state = get(result, "state", state);

  const events = (get(result, "events", []) || []).filter(Array.isArray);
  const status = get(result, "result", "unknown");
  const debug = get(result, "debug", []);
  const entities = get(state, "entities", []);

  console.log(`\n=== STEP ${i + 1}: ${actions[i]} ===`);
  console.log("entities:", JSON.stringify(entities));
  console.log("status:", status);
  console.log("events:", JSON.stringify(events));
  console.log("debug:", JSON.stringify(debug));

  if (status !== "ongoing") break;
}
