#!/usr/bin/env node
import readline from "readline";
import { run } from "./src/run.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "simla> "
});

console.log("Simλ REPL v0.1.0");
console.log("Paste full JSON program (multi-line supported). Type :run to execute.\n");

let buffer = "";

rl.prompt();

rl.on("line", (line) => {
  const input = line.trim();

  if (input === ":exit") {
    rl.close();
    return;
  }

  if (input === ":run") {
    try {
      const program = JSON.parse(buffer);
      const result = run(program);
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error("Error:", err.message);
    }

    buffer = "";
    rl.prompt();
    return;
  }

  // accumulate lines
  buffer += line + "\n";

  rl.setPrompt("... ");
  rl.prompt();

}).on("close", () => {
  process.exit(0);
});
