import fs from "fs";
import { parse } from "../src/parser.js";
import { compile } from "../src/compiler.js";
import { run } from "../src/vm.js";

function tokenize(code) {
  return code
    .replace(/;;.*$/gm, "")
    .replace(/\(/g, " ( ")
    .replace(/\)/g, " ) ")
    .match(/"[^"]*"|\S+/g);
}

const code = fs.readFileSync("examples/entity_world.mc", "utf8");

const ast = parse(tokenize(code));
const bytecode = compile(ast);
const step = run(bytecode, {});

console.log(JSON.stringify(step.result, null, 2));

const entities = step.result[1];
const count = step.result[3];

if (count !== 2) {
  throw new Error("ENTITY WORLD failed: expected 2 surviving entities");
}

if (entities[1][5] !== 2) {
  throw new Error("ENTITY WORLD failed: expected first enemy hp to be 2");
}
