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
  const [type, rawTile] = arg.split(":");
  return {
    actionType: type,
    actionTile: Number(rawTile || 0)
  };
}

const file = "examples/combat_loop_stateful.sim";
const code = fs.readFileSync(file, "utf8");
const ast = parse(tokenize(code));
const bytecode = compile(ast);

let state = {
  playerHp: 20,
  enemyHp: 15,
  playerTile: 7,
  enemyTile: 10
};

const actions = process.argv.slice(2);

if (actions.length === 0) {
  console.log("Usage:");
  console.log("  node tools/run_combat_sequence.js move:8 end:0 attack:10 end:0");
  process.exit(0);
}

for (let i = 0; i < actions.length; i++) {
  const action = parseAction(actions[i]);

  const result = run(bytecode, {
    ...state,
    ...action
  }).result;

  const nextStateList = get(result, "state", []);
  const events = (get(result, "events", []) || []).filter(Array.isArray);
  const status = get(result, "result", "unknown");
  const debug = get(result, "debug", []);

  state = {
    playerHp: get(nextStateList, "playerHp", state.playerHp),
    enemyHp: get(nextStateList, "enemyHp", state.enemyHp),
    playerTile: get(nextStateList, "playerTile", state.playerTile),
    enemyTile: get(nextStateList, "enemyTile", state.enemyTile)
  };

  console.log(`\n=== STEP ${i + 1}: ${actions[i]} ===`);
  console.log("state:", JSON.stringify(state));
  console.log("status:", status);
  console.log("events:", JSON.stringify(events));
  console.log("debug:", JSON.stringify(debug));

  if (status !== "ongoing") {
    break;
  }
}
