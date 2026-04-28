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

function extractParams(node) {
  if (node.type !== "call") {
    throw new Error("Invalid parameter list");
  }

  const params = [node.name];

  for (const arg of node.args) {
    if (arg.type !== "identifier") {
      throw new Error("Invalid parameter");
    }
    params.push(arg.name);
  }

  return params;
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

    // let
    if (node.name === "let") {
      const value = evaluate(node.args[1], env);
      env.set(node.args[0].name, value);
      return value;
    }

    // fn
    if (node.name === "fn") {
      const nameNode = node.args[0];
      const paramsNode = node.args[1];
      const bodyNode = node.args[2];

      const params = extractParams(paramsNode);

      const func = {
        type: "function",
        params,
        body: bodyNode,
        closure: env
      };

      env.set(nameNode.name, func);
      return func;
    }

    // if (special form)
    if (node.name === "if") {
      const cond = evaluate(node.args[0], env);

      if (cond) {
        return evaluate(node.args[1], env);
      } else {
        return evaluate(node.args[2], env);
      }
    }

    // builtins
    if (["add","sub","mul","div","print","gt","lt","eq"].includes(node.name)) {
      const args = node.args.map(arg => evaluate(arg, env));

      switch (node.name) {
        case "add": return args[0] + args[1];
        case "sub": return args[0] - args[1];
        case "mul": return args[0] * args[1];
        case "div": return args[0] / args[1];
        case "print":
          console.log(args[0]);
          return args[0];
        case "gt": return args[0] > args[1];
        case "lt": return args[0] < args[1];
        case "eq": return args[0] === args[1];
      }
    }

    // user function
    const fnValue = env.get(node.name);

    if (fnValue.type === "function") {
      const callEnv = createEnv(fnValue.closure);

      for (let i = 0; i < fnValue.params.length; i++) {
        const argValue = evaluate(node.args[i], env);
        callEnv.set(fnValue.params[i], argValue);
      }

      return evaluate(fnValue.body, callEnv);
    }

    throw new Error("Not a function: " + node.name);
  }

  throw new Error("Unknown node type");
}

module.exports = { evaluate, createEnv };
