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

  if (node.type === "list") {
    for (const el of node.elements) compile(el, out);
    out.push(["LIST", node.elements.length]);
    return out;
  }

  if (node.type === "call") {
    const name = node.callee.name;

    // ===== CONTROL =====
    if (name === "begin") {
      for (let i = 0; i < node.args.length; i++) {
        compile(node.args[i], out);
        if (i < node.args.length - 1) out.push(["POP"]);
      }
      return out;
    }

    if (name === "let") {
      compile(node.args[1], out);
      out.push(["STORE", node.args[0].name]);
      return out;
    }

    if (name === "fn") {
      const params = node.args[0].elements.map(e => e.name);

      const body = [];
      for (let i = 1; i < node.args.length; i++) {
        compile(node.args[i], body);
        if (i < node.args.length - 1) body.push(["POP"]);
      }

      out.push(["FN", params, body]);
      return out;
    }

    // ===== DATA =====
    if (name === "list") {
      for (const arg of node.args) compile(arg, out);
      out.push(["LIST", node.args.length]);
      return out;
    }

    if (name === "map") {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push(["MAP"]);
      return out;
    }

    // ===== LIST ACCESS (CRITICAL FIX) =====
    if (name === "first") {
      compile(node.args[0], out);
      out.push(["FIRST"]);
      return out;
    }

    if (name === "second") {
      compile(node.args[0], out);
      out.push(["SECOND"]);
      return out;
    }

    if (name === "nth") {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push(["NTH"]);
      return out;
    }

    // ===== MATH =====
    const ops = {
      add: "ADD",
      sub: "SUB",
      mul: "MUL",
      div: "DIV",
      min: "MIN",
      max: "MAX",
      or: "OR",
      gt: "GT"
    };

    if (ops[name]) {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push([ops[name]]);
      return out;
    }

    // 🚨 HARD FAIL instead of silent CALL
    throw new Error("Unknown function: " + name);
  }

  return out;
}

export { compile };
