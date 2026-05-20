import fs from "fs";
import { tokenize } from "../src/tokenizer.js";
import { parse } from "../src/parser.js";
import { compile } from "../src/compiler.js";
import { run } from "../src/vm.js";

const file = process.argv[2];

if (!file) {
  console.error("usage: node tools/run_js_vm.js <file.sim>");
  process.exit(1);
}

const source = fs.readFileSync(file, "utf8");

console.error("TOKENIZING...");
const tokens = tokenize(source);

console.error("PARSING...");
const ast = parse(tokens);

console.error("COMPILING...");
const program = compile(ast);

console.error("RUNNING...");
const result = run(program);

console.error("RESULT TYPE:", typeof result);

try {
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error("JSON stringify failed:");
  console.error(err);

  console.error("RAW RESULT:");
  console.dir(result, { depth: null });
}
