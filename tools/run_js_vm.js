import fs from "fs";
import { tokenize } from "../src/tokenizer.js";
import { parse } from "../src/parser.js";
import { compile } from "../src/compiler.js";
import { run } from "../src/vm.js";

const file = process.argv[2];
const source = fs.readFileSync(file, "utf-8");

const tokens = tokenize(source);
const ast = parse(tokens);
const program = compile(ast);
const result = run(program);

function normalize(value) {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (value && typeof value === "object" && "result" in value) {
    return normalize(value.result);
  }
  return String(value);
}

console.log(normalize(result));
