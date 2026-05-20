import fs from "fs";
import { parse } from "../src/parser.js";
import { compile } from "../src/compiler.js";
import { run } from "../src/vm.js";

function tokenize(code) {
  return code
    .replace(/;;.*$/gm, "")
    .replace(/\(/g, " ( ")
    .replace(/\)/g, " ) ")
    .match(/"[^"]*"|\S+/g) || [];
}

const file = process.argv[2] || "c-simla/combat_rule.sim";
const code = fs.readFileSync(file, "utf8");

const ast = parse(tokenize(code));
const bytecode = compile(ast);
const step = run(bytecode, {});

const result =
  step && typeof step === "object" && "result" in step
    ? step.result
    : step;

console.log(`Result: ${result}`);
