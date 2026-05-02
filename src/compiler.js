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
      compile(node.args[1], out); // list first
      compile(node.args[0], out); // function second
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
      mod: "MOD",
      min: "MIN",
      max: "MAX",
      or: "OR",
        and: "AND",
        gt: "GT",
        lt: "LT",
        eq: "EQ",
        lte: "LTE",
        gte: "GTE"
    };

    if (ops[name]) {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push([ops[name]]);
      return out;
    }

    
    if (name === "if") {
      compile(node.args[0], out); // condition

      const thenBlock = [];
      compile(node.args[1], thenBlock);

      const elseBlock = [];
      compile(node.args[2], elseBlock);

      out.push(["IF", thenBlock, elseBlock]);
      return out;
    }


    if (name === "append") {
      compile(node.args[0], out); // list
      compile(node.args[1], out); // item
      out.push(["APPEND"]);
      return out;
    }

    if (name === "not") {
      compile(node.args[0], out);
      out.push(["NOT"]);
      return out;
    }


    if (name === "type") {
      compile(node.args[0], out);
      out.push(["TYPE"]);
      return out;
    }

    if (name === "len") {
      compile(node.args[0], out);
      out.push(["LEN"]);
      return out;
    }

      if (name === "strlen") {
        compile(node.args[0], out);
        out.push(["STRLEN"]);
        return out;
      }

      if (name === "charat") {
        compile(node.args[0], out);
        compile(node.args[1], out);
        out.push(["CHARAT"]);
        return out;
      }

      if (name === "substr") {
        compile(node.args[0], out);
        compile(node.args[1], out);
        compile(node.args[2], out);
        out.push(["SUBSTR"]);
        return out;
      }

      if (name === "strcat") {
        compile(node.args[0], out);
        compile(node.args[1], out);
        out.push(["STRCAT"]);
        return out;
      }

      if (name === "tonumber") {
        compile(node.args[0], out);
        out.push(["TONUMBER"]);
        return out;
      }

    if (name === "concat") {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push(["CONCAT"]);
      return out;
    }


    if (name === "nth") {
      compile(node.args[0], out); // list
      compile(node.args[1], out); // index
      out.push(["NTH"]);
      return out;
    }


    if (name === "debug") {
      compile(node.args[0], out);
      out.push(["DEBUG"]);
      return out;
    }

    if (name === "sin") {
      compile(node.args[0], out);
      out.push(["SIN"]);
      return out;
    }

    if (name === "cos") {
      compile(node.args[0], out);
      out.push(["COS"]);
      return out;
    }

    if (name === "sqrt") {
      compile(node.args[0], out);
      out.push(["SQRT"]);
      return out;
    }

    if (name === "atan2") {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push(["ATAN2"]);
      return out;
    }

    if (name === "abs") {
      compile(node.args[0], out);
      out.push(["ABS"]);
      return out;
    }


    if (name === "damage_all") {
      compile(node.args[0], out); // list
      compile(node.args[1], out); // tick
      out.push(["DAMAGE_ALL"]);
      return out;
    }

      
    if (name === "battle_report") {
      compile(node.args[0], out); // entities
      compile(node.args[1], out); // ticks
      compile(node.args[2], out); // initial player hp
      compile(node.args[3], out); // initial enemy hp
      out.push(["BATTLE_REPORT"]);
      return out;
    }

              if (name === "empty") {
      compile(node.args[0], out);
      out.push(["EMPTY"]);
      return out;
    }

    if (name === "slice") {
      compile(node.args[0], out); // list
      compile(node.args[1], out); // start
      out.push(["SLICE"]);
      return out;
    }

    // Simλ UI primitives
    if (name === "hero") {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push(["HERO"]);
      return out;
    }

    if (name === "card") {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push(["CARD"]);
      return out;
    }

    if (name === "cards") {
      compile(node.args[0], out);
      out.push(["CARDS"]);
      return out;
    }

    if (name === "code") {
      compile(node.args[0], out);
      out.push(["CODE"]);
      return out;
    }

    if (name === "page") {
      compile(node.args[0], out);
      out.push(["PAGE"]);
      return out;
    }

    if (name === "button") {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push(["BUTTON"]);
      return out;
    }

    if (name === "theme") {
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push(["THEME"]);
      return out;
    }

        if (name === "range") {
      compile(node.args[0], out); // start
      compile(node.args[1], out); // end
      out.push(["RANGE"]);
      return out;
    }

    if (name === "flatten") {
      compile(node.args[0], out);
      out.push(["FLATTEN"]);
      return out;
    }

    // user-defined function call
    compile(node.callee, out);
    for (const arg of node.args) {
      compile(arg, out);
    }
    out.push(["CALL", node.args.length]);
    return out;
throw new Error("Unknown function: " + name);
  }

  return out;
}

export { compile };
