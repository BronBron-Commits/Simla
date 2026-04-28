import { tokenize } from "../src/tokenizer.js";
import { parse } from "../src/parser.js";

function assert(cond, name) {
  console.log(cond ? "PASS" : "FAIL", "-", name);
}

function getAST(code) {
  return parse(tokenize(code));
}

// empty list must NOT crash
try {
  const ast = getAST("()");
  assert(!!ast, "empty list parses");
} catch (e) {
  assert(false, "empty list parses");
}
