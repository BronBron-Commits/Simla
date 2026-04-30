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

function get(list, key) {
  if (!Array.isArray(list)) return undefined;
  for (let i = 0; i < list.length; i += 2) {
    if (list[i] === key) return list[i + 1];
  }
  return undefined;
}

const file = process.argv[2] || "examples/combat_loop.sim";
const actionType = process.argv[3] || "move";
const actionTile = Number(process.argv[4] || 8);

const code = fs.readFileSync(file, "utf8");
const ast = parse(tokenize(code));
const bytecode = compile(ast);

const result = run(bytecode, {
  actionType,
  actionTile
}).result;

const state = get(result, "state");
const events = (get(result, "events") || []).filter(Array.isArray);
const debug = get(result, "debug");
const status = get(result, "result");

console.log(JSON.stringify({
  status,
  state,
  events,
  debug
}, null, 2));
