function compile(node, out = []) {

  if (node.type === "program") {
    for (const expr of node.body) compile(expr, out);
    return out;
  }

  if (node.type === "number") {
    out.push(["PUSH", node.value]);
    return out;
  }

  if (node.type === "identifier") {
    out.push(["LOAD", node.name]);
    return out;
  }

  if (node.type === "call") {

    // let
    if (node.name === "let") {
      compile(node.args[1], out);
      out.push(["STORE", node.args[0].name]);
      return out;
    }

    // fn (FIXED: now returns function)
    if (node.name === "fn") {
      const nameNode   = node.args[0];
      const paramsNode = node.args[1];
      const bodyNode   = node.args[2];

      const params = [paramsNode.name, ...paramsNode.args.map(a => a.name)];

      const bodyCode = [];
      compile(bodyNode, bodyCode);
      bodyCode.push(["RET"]);

      // create function
      out.push(["FUNC", nameNode.name, params, bodyCode]);

      // NEW: push it so fn is an expression
      out.push(["LOAD", nameNode.name]);

      return out;
    }

    // if
    if (node.name === "if") {
      compile(node.args[0], out);

      const jmpFalse = out.length;
      out.push(["JMP_IF_FALSE", null]);

      compile(node.args[1], out);

      const jmpEnd = out.length;
      out.push(["JMP", null]);

      out[jmpFalse][1] = out.length;

      compile(node.args[2], out);

      out[jmpEnd][1] = out.length;
      return out;
    }

    // builtins
    if (["add","sub","mul","div","gt","lt","eq"].includes(node.name)) {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push([node.name.toUpperCase()]);
      return out;
    }

    if (node.name === "print") {
      compile(node.args[0], out);
      out.push(["PRINT"]);
      return out;
    }

    // function call
    for (const arg of node.args) compile(arg, out);
    out.push(["CALL", node.name, node.args.length]);
    return out;
  }

  return out;
}

module.exports = { compile };
