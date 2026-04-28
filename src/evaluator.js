function createEnv(parent = null) {
  return {
    vars: {},
    parent,
    get(name) {
      if (name in this.vars) return this.vars[name];
      if (this.parent) return this.parent.get(name);
      throw new Error("Undefined variable: " + name);
    },
    set(name, value) {
      this.vars[name] = value;
    }
  };
}

function evaluate(node, env) {
  if (node.type === "program") {
    let result;
    for (const expr of node.body) {
      result = evaluate(expr, env);
    }
    return result;
  }

  if (node.type === "number") return node.value;

  if (node.type === "identifier") {
    return env.get(node.name);
  }

  if (node.type === "call") {
    // let binding
    if (node.name === "let") {
      const nameNode = node.args[0];
      const valueNode = node.args[1];

      if (nameNode.type !== "identifier") {
        throw new Error("let requires identifier");
      }

      const value = evaluate(valueNode, env);
      env.set(nameNode.name, value);
      return value;
    }

    const args = node.args.map(arg => evaluate(arg, env));

    switch (node.name) {
      case "add": return args[0] + args[1];
      case "sub": return args[0] - args[1];
      case "mul": return args[0] * args[1];
      case "div": return args[0] / args[1];
      case "print":
        console.log(args[0]);
        return args[0];
      default:
        throw new Error("Unknown function: " + node.name);
    }
  }

  throw new Error("Unknown node type");
}

module.exports = { evaluate, createEnv };
