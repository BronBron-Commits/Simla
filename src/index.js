const fs = require("fs");
const { tokenize } = require("./lexer");
const { parse } = require("./parser");
const { evaluate, createEnv } = require("./evaluator");

const file = process.argv[2];

if (!file) {
  console.error("Provide a file");
  process.exit(1);
}

const input = fs.readFileSync(file, "utf-8");

const tokens = tokenize(input);
const ast = parse(tokens);

const globalEnv = createEnv();
const result = evaluate(ast, globalEnv);

console.log("Result:", result);
