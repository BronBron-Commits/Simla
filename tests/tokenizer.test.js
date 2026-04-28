import { tokenize } from "../src/tokenizer.js";

function assertEqual(a, b, name) {
  const ok = JSON.stringify(a) === JSON.stringify(b);
  console.log(ok ? "PASS" : "FAIL", "-", name);
  if (!ok) {
    console.log("Expected:", b);
    console.log("Got     :", a);
  }
}

// basic atoms
assertEqual(tokenize("42"), ["42"], "number");
assertEqual(tokenize("hello"), ["hello"], "symbol");

// simple list
assertEqual(
  tokenize("(+ 1 2)"),
  ["(", "+", "1", "2", ")"],
  "simple list"
);

// nested
assertEqual(
  tokenize("(+ (* 2 3) 4)"),
  ["(", "+", "(", "*", "2", "3", ")", "4", ")"],
  "nested list"
);

// whitespace
assertEqual(
  tokenize("( +   1\n2 )"),
  ["(", "+", "1", "2", ")"],
  "whitespace"
);

// edge cases
assertEqual(tokenize("()"), ["(", ")"], "empty list");

// comments
assertEqual(
  tokenize("(+ 1 2) ;; comment"),
  ["(", "+", "1", "2", ")"],
  "comment stripping"
);
