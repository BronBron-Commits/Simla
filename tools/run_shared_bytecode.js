import fs from "fs";
import { runSharedBytecode } from "../src/vm.js";

function parseSharedBytecode(text) {
  const tokens = text.trim().split(/\s+/);
  let i = 0;

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

  if (next() !== "SIMLA_BC1") {
    throw new Error("invalid shared bytecode header");
  }

  expect("code_count");
  const codeCount = nextInt();
  const code = [];
  for (let n = 0; n < codeCount; n++) {
    code.push({ op: nextInt(), a: nextInt() });
  }

  expect("map_func_count");
  const mapFuncCount = nextInt();
  const map_funcs = [];

  for (let m = 0; m < mapFuncCount; m++) {
    expect("map_param_slot");
    const param_slot = nextInt();

    expect("map_code_count");
    const mapCodeCount = nextInt();
    const mapCode = [];

    for (let k = 0; k < mapCodeCount; k++) {
      mapCode.push({ op: nextInt(), a: nextInt() });
    }

    map_funcs.push({ param_slot, code: mapCode });
  }

  expect("filter_func_count");
  const filterFuncCount = nextInt();
  const filter_funcs = [];

  for (let m = 0; m < filterFuncCount; m++) {
    expect("filter_param_slot");
    const param_slot = nextInt();

    expect("filter_code_count");
    const filterCodeCount = nextInt();
    const filterCode = [];

    for (let k = 0; k < filterCodeCount; k++) {
      filterCode.push({ op: nextInt(), a: nextInt() });
    }

    filter_funcs.push({ param_slot, code: filterCode });
  }

  expect("reduce_func_count");
  const reduceFuncCount = nextInt();
  const reduce_funcs = [];

  for (let m = 0; m < reduceFuncCount; m++) {
    expect("reduce_acc_slot");
    const acc_slot = nextInt();

    expect("reduce_item_slot");
    const item_slot = nextInt();

    expect("reduce_code_count");
    const reduceCodeCount = nextInt();
    const reduceCode = [];

    for (let k = 0; k < reduceCodeCount; k++) {
      reduceCode.push({ op: nextInt(), a: nextInt() });
    }

    reduce_funcs.push({ acc_slot, item_slot, code: reduceCode });
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
