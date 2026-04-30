import assert from "node:assert/strict";
import fs from "node:fs";
import { parse } from "../../src/parser.js";
import { tokenize } from "../../src/tokenizer.js";
import { compile } from "../../src/compiler.js";
import { run } from "../../src/vm.js";

const src = fs.readFileSync("examples/self_hosting/parser_stage4_source_run.sim", "utf8");
const ast = parse(tokenize(src));
const bytecode = compile(ast);
const result = run(bytecode);

assert.deepEqual(result.result, [5, 10, 10, 20]);

console.log("self-hosting source pipeline OK", JSON.stringify(result.result));
