#!/usr/bin/env node
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";

function parseArgs(argv) {
  const options = {
    cases: 100,
    depth: 4,
    seed: 12345,
    keepTemp: false
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--cases") options.cases = Number(argv[++i]);
    else if (arg === "--depth") options.depth = Number(argv[++i]);
    else if (arg === "--seed") options.seed = Number(argv[++i]);
    else if (arg === "--keep-temp") options.keepTemp = true;
    else throw new Error(`unknown argument: ${arg}`);
  }

  if (!Number.isInteger(options.cases) || options.cases <= 0) {
    throw new Error("--cases must be a positive integer");
  }

  if (!Number.isInteger(options.depth) || options.depth <= 0) {
    throw new Error("--depth must be a positive integer");
  }

  if (!Number.isInteger(options.seed)) {
    throw new Error("--seed must be an integer");
  }

  return options;
}

class RNG {
  constructor(seed) {
    this.state = seed >>> 0;
  }

  next() {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick(items) {
    return items[this.int(0, items.length - 1)];
  }

  chance(numerator, denominator) {
    return this.int(1, denominator) <= numerator;
  }
}

const VAR_NAMES = ["x", "y", "z", "a", "b", "n", "m", "t"];

function pickFreshName(rng, env) {
  const candidates = VAR_NAMES.filter((name) => !env.includes(name));
  if (candidates.length > 0) return rng.pick(candidates);
  return `v${rng.int(0, 9999)}`;
}

function genLiteral(rng) {
  return String(rng.int(0, 9));
}

function genNonZeroLiteral(rng) {
  return String(rng.int(1, 9));
}

function genSimpleIntExpr(rng, depth, env) {
  if (depth <= 0) {
    if (env.length > 0 && rng.chance(1, 3)) return rng.pick(env);
    return genLiteral(rng);
  }

  const choices = ["literal", "arith"];
  if (env.length > 0) choices.push("identifier");
  const choice = rng.pick(choices);

  if (choice === "identifier") return rng.pick(env);
  if (choice === "literal") return genLiteral(rng);

  const op = rng.pick(["add", "sub", "mul", "div"]);
  const left = genSimpleIntExpr(rng, depth - 1, env);
  const right = op === "div" ? genNonZeroLiteral(rng) : genSimpleIntExpr(rng, depth - 1, env);
  return `(${op} ${left} ${right})`;
}

function genBoolExpr(rng, depth, env) {
  if (depth <= 0) {
    const op = rng.pick(["lt", "gt", "eq"]);
    return `(${op} ${genSimpleIntExpr(rng, 0, env)} ${genSimpleIntExpr(rng, 0, env)})`;
  }

  const choice = rng.pick(["cmp", "logic", "ifbool"]);
  if (choice === "cmp") {
    const op = rng.pick(["lt", "gt", "eq"]);
    return `(${op} ${genSimpleIntExpr(rng, depth - 1, env)} ${genSimpleIntExpr(rng, depth - 1, env)})`;
  }

  if (choice === "logic") {
    const op = rng.pick(["and", "or"]);
    return `(${op} ${genBoolExpr(rng, depth - 1, env)} ${genBoolExpr(rng, depth - 1, env)})`;
  }

  return `(if ${genBoolExpr(rng, depth - 1, env)} ${genBoolExpr(rng, depth - 1, env)} ${genBoolExpr(rng, depth - 1, env)})`;
}

function genMapBody(rng) {
  const op = rng.pick(["add", "sub", "mul"]);
  const amount = rng.int(1, 4);
  if (op === "mul") return `(${op} x ${amount})`;
  if (rng.chance(1, 3)) {
    return `(if (gt x ${rng.int(0, 4)}) (${op} x ${amount}) (add x ${rng.int(0, 3)}))`;
  }
  return `(${op} x ${amount})`;
}

function genFilterBody(rng) {
  const threshold = rng.int(0, 6);
  const choice = rng.pick(["gt", "lt", "eq", "or"]);
  if (choice === "or") {
    return `(or (gt x ${threshold}) (eq x ${rng.int(0, 6)}))`;
  }
  return `(${choice} x ${threshold})`;
}

function genReduceBody(rng) {
  const choice = rng.pick(["add", "sub", "mix"]);
  if (choice === "add") return `(add acc x)`;
  if (choice === "sub") return `(sub acc x)`;
  return `(if (gt x ${rng.int(0, 6)}) (add acc x) acc)`;
}

function genListExpr(rng, depth, env, requireNonEmpty = false) {
  if (depth <= 0) {
    const length = requireNonEmpty ? rng.int(1, 4) : rng.int(0, 4);
    const items = [];
    for (let i = 0; i < length; i++) {
      items.push(genSimpleIntExpr(rng, 0, env));
    }
    return {
      source: length === 0 ? "(range 0 0)" : `(list ${items.join(" ")})`,
      length,
      guaranteedNonEmpty: length > 0
    };
  }

  const choices = requireNonEmpty
    ? ["list", "range", "map"]
    : ["list", "range", "map", "filter"];
  const choice = rng.pick(choices);

  if (choice === "list") {
    const length = requireNonEmpty ? rng.int(1, 4) : rng.int(0, 4);
    const items = [];
    for (let i = 0; i < length; i++) {
      items.push(genSimpleIntExpr(rng, depth - 1, env));
    }
    return {
      source: length === 0 ? "(range 0 0)" : `(list ${items.join(" ")})`,
      length,
      guaranteedNonEmpty: length > 0
    };
  }

  if (choice === "range") {
    const start = rng.int(0, 5);
    let end = rng.int(0, 5);
    if (requireNonEmpty && end === start) {
      end = end === 5 ? 4 : end + 1;
    }
    return {
      source: `(range ${start} ${end})`,
      length: Math.abs(end - start),
      guaranteedNonEmpty: start !== end
    };
  }

  const base = genListExpr(rng, depth - 1, env, requireNonEmpty && choice === "map");

  if (choice === "map") {
    return {
      source: `(map (fn (x) ${genMapBody(rng)}) ${base.source})`,
      length: base.length,
      guaranteedNonEmpty: base.guaranteedNonEmpty
    };
  }

  return {
    source: `(filter (fn (x) ${genFilterBody(rng)}) ${base.source})`,
    length: 0,
    guaranteedNonEmpty: false
  };
}

function genIntExpr(rng, depth, env) {
  if (depth <= 0) {
    if (env.length > 0 && rng.chance(1, 4)) return rng.pick(env);
    return genLiteral(rng);
  }

  const choices = ["literal", "arith", "if", "len", "reduce", "let"];
  if (env.length > 0) choices.push("identifier");
  if (depth > 1) choices.push("nth");
  const choice = rng.pick(choices);

  if (choice === "identifier") return rng.pick(env);
  if (choice === "literal") return genLiteral(rng);

  if (choice === "arith") {
    const op = rng.pick(["add", "sub", "mul", "div"]);
    const left = genIntExpr(rng, depth - 1, env);
    const right = op === "div" ? genNonZeroLiteral(rng) : genIntExpr(rng, depth - 1, env);
    return `(${op} ${left} ${right})`;
  }

  if (choice === "if") {
    return `(if ${genBoolExpr(rng, depth - 1, env)} ${genIntExpr(rng, depth - 1, env)} ${genIntExpr(rng, depth - 1, env)})`;
  }

  if (choice === "len") {
    const listExpr = genListExpr(rng, depth - 1, env, false);
    return `(len ${listExpr.source})`;
  }

  if (choice === "nth") {
    const listExpr = genListExpr(rng, depth - 1, env, true);
    const upper = Math.max(0, listExpr.length - 1);
    return `(nth ${listExpr.source} ${rng.int(0, upper)})`;
  }

  if (choice === "reduce") {
    const init = genSimpleIntExpr(rng, depth - 1, env);
    const listExpr = genListExpr(rng, depth - 1, env, false);
    return `(reduce (fn (acc x) ${genReduceBody(rng)}) ${init} ${listExpr.source})`;
  }

  const name = pickFreshName(rng, env);
  const value = genIntExpr(rng, depth - 1, env);
  const body = genIntExpr(rng, depth - 1, [...env, name]);
  return `(begin (let ${name} ${value}) ${body})`;
}

function shQuote(value) {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

function runProcess(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: "utf-8"
  });
}

function runNodeTool(script, args, cwd) {
  return runProcess(process.execPath, [script, ...args], cwd);
}

function toWslPath(value) {
  if (process.platform !== "win32") return value;
  const normalized = value.replace(/\\/g, "/");
  const match = normalized.match(/^([A-Za-z]):\/(.*)$/);
  if (!match) return normalized;
  return `/mnt/${match[1].toLowerCase()}/${match[2]}`;
}

function runWsl(command, cwd) {
  return runProcess("wsl", ["--", "bash", "-lc", `cd ${shQuote(toWslPath(cwd))} ; ${command}`], cwd);
}

function normalizeResult(output) {
  const lines = output.replace(/\r/g, "").trim().split("\n").map((line) => line.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith("Result:")) {
      return lines[i].slice("Result:".length).trim();
    }
  }
  return lines.length > 0 ? lines[lines.length - 1] : "";
}

function ensureSuccess(result, label) {
  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    const details = [stdout, stderr].filter(Boolean).join("\n");
    throw new Error(`${label} failed${details ? `\n${details}` : ""}`);
  }
}

function firstTraceMismatch(jsTrace, cTrace) {
  const left = jsTrace.replace(/\r/g, "").trim().split("\n").filter(Boolean);
  const right = cTrace.replace(/\r/g, "").trim().split("\n").filter(Boolean);
  const max = Math.max(left.length, right.length);

  for (let i = 0; i < max; i++) {
    if (left[i] !== right[i]) {
      return {
        line: i + 1,
        js: left[i] ?? "<missing>",
        c: right[i] ?? "<missing>"
      };
    }
  }

  return null;
}

function ensureCRuntimes(workspace) {
  if (process.platform === "win32") {
    const cmd = [
      "if [ ! -x ./c-simla/simla ]; then cc -Wall -Wextra -std=c11 c-simla/simla.c -o c-simla/simla; fi",
      "if [ ! -x ./c-simla/compile_test ]; then cc -Wall -Wextra -std=c11 c-simla/vm.c c-simla/compile_test.c -o c-simla/compile_test; fi",
      "if [ ! -x ./c-simla/shared_bytecode_run ]; then cc -Wall -Wextra -std=c11 c-simla/vm.c c-simla/shared_bytecode_run.c -o c-simla/shared_bytecode_run; fi"
    ].join(" ; ");

    const result = runWsl(cmd, workspace);
    ensureSuccess(result, "C runtime build");
    return;
  }

  const commands = [
    { output: path.join(workspace, "c-simla", "simla"), args: ["-Wall", "-Wextra", "-std=c11", "c-simla/simla.c", "-o", "c-simla/simla"] },
    { output: path.join(workspace, "c-simla", "compile_test"), args: ["-Wall", "-Wextra", "-std=c11", "c-simla/vm.c", "c-simla/compile_test.c", "-o", "c-simla/compile_test"] },
    { output: path.join(workspace, "c-simla", "shared_bytecode_run"), args: ["-Wall", "-Wextra", "-std=c11", "c-simla/vm.c", "c-simla/shared_bytecode_run.c", "-o", "c-simla/shared_bytecode_run"] }
  ];

  for (const command of commands) {
    if (fs.existsSync(command.output)) continue;
    const result = runProcess("cc", command.args, workspace);
    ensureSuccess(result, `build ${path.basename(command.output)}`);
  }
}

function runCProgram(binary, inputRel, workspace, extraArgs = []) {
  if (process.platform === "win32") {
    const command = [shQuote(`./${binary}`), shQuote(inputRel), ...extraArgs.map(shQuote)].join(" ");
    return runWsl(command, workspace);
  }

  return runProcess(path.join(workspace, binary), [inputRel, ...extraArgs], workspace);
}

function runCase(caseIndex, source, tempDir, workspace) {
  const simRel = path.relative(workspace, path.join(tempDir, `case-${caseIndex}.sim`)).split(path.sep).join("/");
  const sbcRel = path.relative(workspace, path.join(tempDir, `case-${caseIndex}.sbc`)).split(path.sep).join("/");

  fs.writeFileSync(path.join(workspace, simRel), `${source}\n`, "utf-8");

  const jsVm = runNodeTool("tools/run_js_vm.js", [simRel], workspace);
  ensureSuccess(jsVm, "JS VM");

  const emit = runNodeTool("tools/emit_shared_bytecode.js", [simRel, sbcRel], workspace);
  ensureSuccess(emit, "shared bytecode emit");

  const jsShared = runNodeTool("tools/run_shared_bytecode.js", [sbcRel], workspace);
  ensureSuccess(jsShared, "JS shared VM");

  const cInterp = runCProgram("c-simla/simla", simRel, workspace);
  ensureSuccess(cInterp, "C interpreter");

  const cBytecode = runCProgram("c-simla/compile_test", simRel, workspace);
  ensureSuccess(cBytecode, "C bytecode compiler/runtime");

  const cShared = runCProgram("c-simla/shared_bytecode_run", sbcRel, workspace);
  ensureSuccess(cShared, "C shared bytecode runtime");

  return {
    simRel,
    sbcRel,
    outputs: {
      jsVm: normalizeResult(jsVm.stdout),
      jsShared: normalizeResult(jsShared.stdout),
      cInterp: normalizeResult(cInterp.stdout),
      cBytecode: normalizeResult(cBytecode.stdout),
      cShared: normalizeResult(cShared.stdout)
    }
  };
}

function collectTraceInfo(sbcRel, workspace) {
  const jsTrace = runNodeTool("tools/run_shared_bytecode.js", [sbcRel, "--trace"], workspace);
  const cTrace = runCProgram("c-simla/shared_bytecode_run", sbcRel, workspace, ["--trace"]);

  const mismatch = firstTraceMismatch(jsTrace.stderr || "", cTrace.stderr || "");
  return {
    jsTrace: jsTrace.stderr || "",
    cTrace: cTrace.stderr || "",
    mismatch
  };
}

function allEqual(outputs) {
  const values = Object.values(outputs);
  return values.every((value) => value === values[0]);
}

function printMismatch(caseIndex, seed, source, result, traceInfo, tempDir) {
  console.error(`Mismatch at case ${caseIndex} with seed ${seed}`);
  console.error(`Temp dir: ${tempDir}`);
  console.error("Program:");
  console.error(source);
  console.error("");
  console.error("Outputs:");
  for (const [name, value] of Object.entries(result.outputs)) {
    console.error(`  ${name}: ${value}`);
  }

  if (traceInfo.mismatch) {
    console.error("");
    console.error(`First shared trace mismatch at line ${traceInfo.mismatch.line}`);
    console.error(`  JS: ${traceInfo.mismatch.js}`);
    console.error(`  C : ${traceInfo.mismatch.c}`);
  } else {
    console.error("");
    console.error("Shared traces agree; mismatch is outside the shared-bytecode runners.");
  }
}

function removeDirRecursive(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const workspace = process.cwd();
  const rng = new RNG(options.seed);
  const tempDir = fs.mkdtempSync(path.join(workspace, ".simla-fuzz-"));

  ensureCRuntimes(workspace);

  let passed = 0;

  try {
    for (let i = 1; i <= options.cases; i++) {
      const source = genIntExpr(rng, options.depth, []);
      const result = runCase(i, source, tempDir, workspace);

      if (!allEqual(result.outputs)) {
        const traceInfo = collectTraceInfo(result.sbcRel, workspace);
        printMismatch(i, options.seed, source, result, traceInfo, tempDir);
        process.exitCode = 1;
        return;
      }

      passed++;
    }

    console.log(`PASS fuzz parity: ${passed} cases, seed=${options.seed}, depth=${options.depth}`);
  } finally {
    if (!options.keepTemp && process.exitCode !== 1) {
      removeDirRecursive(tempDir);
    }
  }
}

main();
