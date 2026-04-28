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

    // control
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
      const rawParams = node.args[0];
      const params =
        rawParams.elements ? rawParams.elements.map(e => e.name) :
        rawParams.type === "call" ? [rawParams.callee.name, ...rawParams.args.map(e => e.name)] :
        rawParams.args ? rawParams.args.map(e => e.name) :
        rawParams.name ? [rawParams.name] :
        [];

      const body = [];
      for (let i = 1; i < node.args.length; i++) {
        compile(node.args[i], body);
        if (i < node.args.length - 1) body.push(["POP"]);
      }

      out.push(["FN", params, body]);
      return out;
    }

    // data
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

    // 🔥 COMPONENT OPS
    
  if (name === "filter") {
    compile(node.args[1], out); // list first
    compile(node.args[0], out); // function second
    out.push(["FILTER"]);
    return out;
  }


  if (name === "reduce") {
    compile(node.args[2], out); // list
    compile(node.args[1], out); // initial accumulator
    compile(node.args[0], out); // function
    out.push(["REDUCE"]);
    return out;
  }

if (name === "get") {
      compile(node.args[0], out); // entity
      compile(node.args[1], out); // key
      out.push(["GET"]);
      return out;
    }

    if (name === "set") {
      compile(node.args[0], out); // entity
      compile(node.args[1], out); // key
      compile(node.args[2], out); // value
      out.push(["SET"]);
      return out;
    }

    // math
    const ops = {
      add: "ADD",
      sub: "SUB",
      mul: "MUL",
      div: "DIV",
      min: "MIN",
      max: "MAX",
      or: "OR",
        gt: "GT",
        lt: "LT",
        eq: "EQ"
    };

    if (ops[name]) {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push([ops[name]]);
      return out;
    }

    throw new Error("Unknown function: " + name);
  }

  return out;
}

export { compile };
