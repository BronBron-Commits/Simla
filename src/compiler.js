function compile(node, out = []) {

  if (node.type === "program") {
    for (const expr of node.body) {
      compile(expr, out);
    }
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

    // if
    if (node.name === "if") {
      compile(node.args[0], out); // condition

      const jmpFalseIndex = out.length;
      out.push(["JMP_IF_FALSE", null]);

      compile(node.args[1], out); // true branch

      const jmpEndIndex = out.length;
      out.push(["JMP", null]);

      // patch false jump
      out[jmpFalseIndex][1] = out.length;

      compile(node.args[2], out); // false branch

      // patch end jump
      out[jmpEndIndex][1] = out.length;

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
    for (const arg of node.args) {
      compile(arg, out);
    }
    out.push(["CALL", node.name, node.args.length]);
    return out;
  }

  return out;
}

module.exports = { compile };
