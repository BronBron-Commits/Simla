#!/usr/bin/env node
import fs from "fs";
import { parse } from "./src/parser.js";
import { compile } from "./src/compiler.js";
import { run } from "./src/vm.js";

function tokenize(code) {
  return code
    .replace(/;;.*$/gm, "")
    .replace(/\(/g, " ( ")
    .replace(/\)/g, " ) ")
    .match(/"[^"]*"|\S+/g);
}

const file = process.argv[2];

if (!file) {
  console.error("Usage: node simla.js <file.sim>");
  process.exit(1);
}

const code = fs.readFileSync(file, "utf8");
const ast = parse(tokenize(code));
const bytecode = compile(ast);
const result = run(bytecode, {}).result;

console.log(JSON.stringify(result, null, 2));
