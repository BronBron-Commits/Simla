import fs from "fs";
import { runSharedBytecode } from "../src/vm.js";

function parseSharedBytecode(text) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("empty shared bytecode");

  const tokens = trimmed.split(/\s+/);
  let i = 0;
  const MAX_OPCODE = 21;

  function next() {
    if (i >= tokens.length) throw new Error("unexpected end of shared bytecode");
    return tokens[i++];
  }

  function expect(label) {
    const got = next();
    if (got !== label) throw new Error(`expected ${label}, got ${got}`);
  }

  function nextInt() {
    const v = Number(next());
    if (!Number.isInteger(v)) throw new Error("expected integer token");
    return v;
  }

  function nextCount(label) {
    expect(label);
    const count = nextInt();
    if (count < 0) throw new Error(`${label} cannot be negative`);
    return count;
  }

  function nextInstruction() {
    const op = nextInt();
    const a = nextInt();
    if (op < 0 || op > MAX_OPCODE) throw new Error(`invalid opcode: ${op}`);
    return { op, a };
  }

  if (next() !== "SIMLA_BC1") {
    throw new Error("invalid shared bytecode header");
  }

  const codeCount = nextCount("code_count");
  const code = [];
  for (let n = 0; n < codeCount; n++) {
    code.push(nextInstruction());
  }

  const mapFuncCount = nextCount("map_func_count");
  const map_funcs = [];

  for (let m = 0; m < mapFuncCount; m++) {
    expect("map_param_slot");
    const param_slot = nextInt();

    const mapCodeCount = nextCount("map_code_count");
    const mapCode = [];

    for (let k = 0; k < mapCodeCount; k++) {
      mapCode.push(nextInstruction());
    }

    map_funcs.push({ param_slot, code: mapCode });
  }

  const filterFuncCount = nextCount("filter_func_count");
  const filter_funcs = [];

  for (let m = 0; m < filterFuncCount; m++) {
    expect("filter_param_slot");
    const param_slot = nextInt();

    const filterCodeCount = nextCount("filter_code_count");
    const filterCode = [];

    for (let k = 0; k < filterCodeCount; k++) {
      filterCode.push(nextInstruction());
    }

    filter_funcs.push({ param_slot, code: filterCode });
  }

  const reduceFuncCount = nextCount("reduce_func_count");
  const reduce_funcs = [];

  for (let m = 0; m < reduceFuncCount; m++) {
    expect("reduce_acc_slot");
    const acc_slot = nextInt();

    expect("reduce_item_slot");
    const item_slot = nextInt();

    const reduceCodeCount = nextCount("reduce_code_count");
    const reduceCode = [];

    for (let k = 0; k < reduceCodeCount; k++) {
      reduceCode.push(nextInstruction());
    }

    reduce_funcs.push({ acc_slot, item_slot, code: reduceCode });
  }

  if (i !== tokens.length) {
    throw new Error("unexpected trailing tokens in shared bytecode");
  }

  return {
    version: "SIMLA_BC1",
    code,
    map_funcs,
    filter_funcs,
    reduce_funcs
  };
}

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("usage: node tools/run_shared_bytecode.js <program.sbc>");
  process.exit(1);
}

const program = parseSharedBytecode(fs.readFileSync(inputPath, "utf-8"));
console.log(`Result: ${runSharedBytecode(program)}`);
