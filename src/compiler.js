function getParams(paramsNode) {
  // paramsNode is a call node: (n) or (a b c)
  if (paramsNode.type !== "call") {
    throw new Error("Invalid parameter list");
  }

  const params = [];

  // first param = callee name
  if (paramsNode.callee.type !== "identifier") {
    throw new Error("Invalid parameter");
  }

  params.push(paramsNode.callee.name);

  // rest
  for (const arg of paramsNode.args) {
    if (arg.type !== "identifier") {
      throw new Error("Invalid parameter");
    }
    params.push(arg.name);
  }

  return params;
}

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

    const callee = node.callee;

    if (callee.type === "identifier") {
      const name = callee.name;

      if (name === "let") {
        compile(node.args[1], out);
        out.push(["STORE", node.args[0].name]);
        return out;
      }

      if (name === "fn") {
        const nameNode   = node.args[0];
        const paramsNode = node.args[1];
        const bodyNode   = node.args[2];

        const params = getParams(paramsNode);

        const bodyCode = [];
        compile(bodyNode, bodyCode);
        bodyCode.push(["RET"]);

        out.push(["MAKE_FUNC", params, bodyCode]);

        if (nameNode && nameNode.name) {
          out.push(["DUP"]);
          out.push(["STORE", nameNode.name]);
        }

        return out;
      }

      if (name === "if") {
        compile(node.args[0], out);

        const jf = out.length;
        out.push(["JMP_IF_FALSE", null]);

        compile(node.args[1], out);

        const je = out.length;
        out.push(["JMP", null]);

        out[jf][1] = out.length;

        compile(node.args[2], out);

        out[je][1] = out.length;
        return out;
      }

      if (["add","sub","mul","div","gt","lt","eq"].includes(name)) {
        compile(node.args[0], out);
        compile(node.args[1], out);
        out.push([name.toUpperCase()]);
        return out;
      }

      if (name === "print") {
        compile(node.args[0], out);
        out.push(["PRINT"]);
        return out;
      }
    }

    // general call
    compile(callee, out);
    for (const arg of node.args) compile(arg, out);
    out.push(["CALL", node.args.length]);

    return out;
  }

  return out;
}

module.exports = { compile };
