import fs from "fs";

let c = fs.readFileSync("src/compiler.js", "utf8");
c = c.replace(
  `if (name === "map") { compile(node.args[0], out); compile(node.args[1], out); out.push(["MAP"]); return out; }`,
  `if (name === "map") { compile(node.args[0], out); compile(node.args[1], out); out.push(["MAP"]); return out; }
  if (name === "filter") { compile(node.args[0], out); compile(node.args[1], out); out.push(["FILTER"]); return out; }`
);
fs.writeFileSync("src/compiler.js", c);

let v = fs.readFileSync("src/vm.js", "utf8");
v = v.replace(
  `case "MAP": { const fn = stack.pop(); const list = stack.pop(); if (!Array.isArray(list)) { stack.push([]); break; } const result = []; for (const item of list) { const newEnv = makeEnv(fn.closure); newEnv.vars[fn.params[0]] = item; const value = exec(fn.body, newEnv); result.push(value); } stack.push(result); break; }`,
  `case "MAP": { const fn = stack.pop(); const list = stack.pop(); if (!Array.isArray(list)) { stack.push([]); break; } const result = []; for (const item of list) { const newEnv = makeEnv(fn.closure); newEnv.vars[fn.params[0]] = item; const value = exec(fn.body, newEnv); result.push(value); } stack.push(result); break; }
case "FILTER": { const fn = stack.pop(); const list = stack.pop(); if (!Array.isArray(list)) { stack.push([]); break; } const result = []; for (const item of list) { const newEnv = makeEnv(fn.closure); newEnv.vars[fn.params[0]] = item; const keep = exec(fn.body, newEnv); if (keep) result.push(item); } stack.push(result); break; }`
);
fs.writeFileSync("src/vm.js", v);
