const fs = require("fs");
const { tokenize } = require("./lexer");
const { parse } = require("./parser");
const { compile } = require("./compiler");
const { run } = require("./vm");

const file = process.argv[2];

const input = fs.readFileSync(file, "utf-8");

const tokens = tokenize(input);
const ast = parse(tokens);

const bytecode = compile(ast);

console.log("BYTECODE:", bytecode);

run(bytecode);
