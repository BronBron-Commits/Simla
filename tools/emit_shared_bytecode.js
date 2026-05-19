import fs from "fs";
import { tokenize } from "../src/tokenizer.js";
import { parse } from "../src/parser.js";
import { compileSharedBytecode, serializeSharedBytecode } from "../src/compiler.js";

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error("usage: node tools/emit_shared_bytecode.js <input.sim> <output.sbc>");
  process.exit(1);
}

const source = fs.readFileSync(inputPath, "utf-8");
const ast = parse(tokenize(source));
const program = compileSharedBytecode(ast);

fs.writeFileSync(outputPath, serializeSharedBytecode(program), "utf-8");
