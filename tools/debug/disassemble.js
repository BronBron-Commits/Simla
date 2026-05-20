import fs from "fs";

import { tokenize } from "../../src/tokenizer.js";
import { parse } from "../../src/parser.js";
import { compile } from "../../src/compiler.js";

const file = process.argv[2];

if (!file) {
  console.error("usage: node tools/debug/disassemble.js file.sim");
  process.exit(1);
}

const src = fs.readFileSync(file, "utf8");

const tokens = tokenize(src);
const ast = parse(tokens);
const bytecode = compile(ast);

console.log("\n=== BYTECODE ===\n");

bytecode.forEach((ins, i) => {

  console.log(
    String(i).padStart(4, " "),
    JSON.stringify(ins)
  );
});
