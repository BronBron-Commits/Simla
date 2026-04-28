function compile(node, out = []) {

  if (node.type === "program") {
    for (const expr of node.body) compile(expr, out);
    return out;
  }

  if (node.type === "number") {
    out.push(["PUSH", node.value]);
    return out;
  }

  if (node.type === "string") {
    out.push(["PUSH", node.value]);
    return out;
  }

  if (node.type === "identifier") {
    out.push(["LOAD", node.name]);
    return out;
  }

  if (node.type === "call") {
    const name = node.callee.name;

    // assignment
    if (name === "let") {
      compile(node.args[1], out);
      out.push(["STORE", node.args[0].name]);
      return out;
    }

    // sequence
    if (name === "begin") {
      for (let i = 0; i < node.args.length; i++) {
        compile(node.args[i], out);
        if (i < node.args.length - 1) out.push(["POP"]);
      }
      return out;
    }

    // math
    if (name === "add") {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push(["ADD"]);
      return out;
    }

    if (name === "sub") {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push(["SUB"]);
      return out;
    }

    if (name === "mul") {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push(["MUL"]);
      return out;
    }

    if (name === "div") {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push(["DIV"]);
      return out;
    }

    // logic
    if (name === "or") {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push(["OR"]);
      return out;
    }

    if (name === "gt") {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push(["GT"]);
      return out;
    }

    // clamp helpers
    if (name === "min") {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push(["MIN"]);
      return out;
    }

    if (name === "max") {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push(["MAX"]);
      return out;
    }

    // list (render)
    if (name === "list") {
      for (const arg of node.args) compile(arg, out);
      out.push(["LIST", node.args.length]);
      return out;
    }

    throw new Error("Unsupported call: " + name);
  }

  return out;
}

export { compile };
