const LEGACY_BINARY_OPS = {
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
  gte: "GTE",
  nth: "NTH",
  range: "RANGE"
};

const SHARED_BINARY_OPS = {
  add: 1,
  sub: 2,
  mul: 3,
  div: 4,
  lt: 7,
  gt: 8,
  eq: 9,
  and: 10,
  or: 11,
  nth: 16,
  range: 17
};

const LEGACY_UNARY_OPS = {
  len: "LEN"
};

const SHARED_UNARY_OPS = {
  len: 15
};

function isCallName(node, name) {
  return node && node.type === "call" && node.callee && node.callee.name === name;
}

function expectArgs(node, name, count) {
  if (!node.args || node.args.length !== count) {
    throw new Error(`${name} expects ${count} args`);
  }
}

function extractParams(paramsNode) {
  if (!paramsNode) throw new Error("missing params node");
  if (paramsNode.type === "list") {
    return paramsNode.elements.map((param) => {
      if (!param || param.type !== "identifier") throw new Error("function params must be symbols");
      return param.name;
    });
  }
  if (paramsNode.type === "call") {
    return [paramsNode.callee.name, ...paramsNode.args.map((param) => {
      if (!param || param.type !== "identifier") throw new Error("function params must be symbols");
      return param.name;
    })];
  }
  if (paramsNode.type === "identifier") return [paramsNode.name];
  throw new Error("function params must be list");
}

function compileBinaryOpCall(node, out, compileExpr, opMap, emitOp) {
  const op = opMap[node.callee.name];
  if (op === undefined) return false;
  expectArgs(node, node.callee.name, 2);
  compileExpr(node.args[0], out);
  compileExpr(node.args[1], out);
  emitOp(out, op);
  return true;
}

function compileUnaryOpCall(node, out, compileExpr, opMap, emitOp) {
  const op = opMap[node.callee.name];
  if (op === undefined) return false;
  expectArgs(node, node.callee.name, 1);
  compileExpr(node.args[0], out);
  emitOp(out, op);
  return true;
}

function compileListCall(node, out, compileExpr, emitList) {
  if (!isCallName(node, "list")) return false;
  for (const arg of node.args) compileExpr(arg, out);
  emitList(out, node.args.length);
  return true;
}

function compileSequence(nodes, out, compileExpr, betweenExprs = null) {
  for (let i = 0; i < nodes.length; i++) {
    compileExpr(nodes[i], out);
    if (betweenExprs && i < nodes.length - 1) betweenExprs(out);
  }
}

function getLetBinding(node) {
  expectArgs(node, "let", 2);
  if (!node.args[0] || node.args[0].type !== "identifier") {
    throw new Error("invalid let");
  }
  return { name: node.args[0].name, value: node.args[1] };
}

function compileIfCall(node, out, compileExpr, emitIf) {
  if (!isCallName(node, "if")) return false;
  expectArgs(node, "if", 3);
  emitIf(node.args[0], node.args[1], node.args[2], out, compileExpr);
  return true;
}

function compileHigherOrderCall(node, out, compileExpr, spec, emitCall) {
  if (!isCallName(node, spec.name)) return false;
  expectArgs(node, spec.name, spec.argCount);

  emitCall({
    fnNode: node.args[0],
    initNode: spec.argCount === 3 ? node.args[1] : null,
    listNode: node.args[spec.argCount - 1]
  }, out, compileExpr);

  return true;
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

  if (node.type === "string") {
    out.push(["PUSH", node.value]);
    return out;
  }

  if (node.type === "symbol") {
    out.push(["SYMBOL", node.name]);
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
      compileSequence(node.args, out, compile, (target) => target.push(["POP"]));
      return out;
    }

    if (name === "let") {
      const binding = getLetBinding(node);
      compile(binding.value, out);
      out.push(["STORE", binding.name]);
      return out;
    }

    if (name === "fn") {
      const params = extractParams(node.args[0]);

      const body = [];
      compileSequence(node.args.slice(1), body, compile, (target) => target.push(["POP"]));

      out.push(["FN", params, body]);
      return out;
    }

    // data
    if (compileListCall(node, out, compile, (target, count) => target.push(["LIST", count]))) {
      return out;
    }

    if (compileHigherOrderCall(node, out, compile, { name: "map", argCount: 2 }, ({ fnNode, listNode }, target, compileNode) => {
      compileNode(listNode, target);
      compileNode(fnNode, target);
      target.push(["MAP"]);
    })) {
      return out;
    }

    if (compileHigherOrderCall(node, out, compile, { name: "filter", argCount: 2 }, ({ fnNode, listNode }, target, compileNode) => {
      compileNode(listNode, target);
      compileNode(fnNode, target);
      target.push(["FILTER"]);
    })) {
      return out;
    }

    if (compileHigherOrderCall(node, out, compile, { name: "reduce", argCount: 3 }, ({ fnNode, initNode, listNode }, target, compileNode) => {
      compileNode(listNode, target);
      compileNode(initNode, target);
      compileNode(fnNode, target);
      target.push(["REDUCE"]);
    })) {
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

    if (name === "obj") {
      if (node.args.length % 2 !== 0) {
        throw new Error("obj expects an even number of args (key/value pairs)");
      }
      for (const arg of node.args) {
        compile(arg, out);
      }
      out.push(["OBJ", node.args.length]);
      return out;
    }

    if (name === "node") {
      expectArgs(node, "node", 3);
      compile(node.args[0], out); // semantic kind
      compile(node.args[1], out); // props object
      compile(node.args[2], out); // child list
      out.push(["NODE"]);
      return out;
    }

    if (name === "vec3") {
      expectArgs(node, "vec3", 3);
      compile(node.args[0], out);
      compile(node.args[1], out);
      compile(node.args[2], out);
      out.push(["VEC3"]);
      return out;
    }

    if (name === "getp") {
      expectArgs(node, "getp", 2);
      compile(node.args[0], out);
      compile(node.args[1], out);
      out.push(["GETP"]);
      return out;
    }

    if (name === "setp") {
      expectArgs(node, "setp", 3);
      compile(node.args[0], out);
      compile(node.args[1], out);
      compile(node.args[2], out);
      out.push(["SETP"]);
      return out;
    }

    if (name === "kind") {
      expectArgs(node, "kind", 1);
      compile(node.args[0], out);
      out.push(["KIND"]);
      return out;
    }

    if (name === "symbol_name") {
      expectArgs(node, "symbol_name", 1);
      compile(node.args[0], out);
      out.push(["SYMBOL_NAME"]);
      return out;
    }

    if (name === "symbol?") {
      expectArgs(node, "symbol?", 1);
      compile(node.args[0], out);
      out.push(["IS_SYMBOL"]);
      return out;
    }

    if (name === "is_node") {
      expectArgs(node, "is_node", 1);
      compile(node.args[0], out);
      out.push(["IS_NODE"]);
      return out;
    }

    if (name === "children") {
      expectArgs(node, "children", 1);
      compile(node.args[0], out);
      out.push(["CHILDREN"]);
      return out;
    }

    if (compileBinaryOpCall(node, out, compile, LEGACY_BINARY_OPS, (target, op) => target.push([op]))) {
      return out;
    }

    
    if (compileIfCall(node, out, compile, (condition, thenNode, elseNode, target, compileNode) => {
      compileNode(condition, target);

      const thenBlock = [];
      compileNode(thenNode, thenBlock);

      const elseBlock = [];
      compileNode(elseNode, elseBlock);

      target.push(["IF", thenBlock, elseBlock]);
    })) {
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

    if (compileUnaryOpCall(node, out, compile, LEGACY_UNARY_OPS, (target, op) => target.push([op]))) {
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

    if (name === "clamp") {
      expectArgs(node, "clamp", 3);
      compile(node.args[0], out);
      compile(node.args[1], out);
      compile(node.args[2], out);
      out.push(["CLAMP"]);
      return out;
    }

    if (name === "lerp") {
      expectArgs(node, "lerp", 3);
      compile(node.args[0], out);
      compile(node.args[1], out);
      compile(node.args[2], out);
      out.push(["LERP"]);
      return out;
    }

    if (name === "invlerp") {
      expectArgs(node, "invlerp", 3);
      compile(node.args[0], out);
      compile(node.args[1], out);
      compile(node.args[2], out);
      out.push(["INVLERP"]);
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

    // SimÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â» UI primitives
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

const SHARED_OPS = {
  CONST: 0,
  ADD: 1,
  SUB: 2,
  MUL: 3,
  DIV: 4,
  LOAD: 5,
  STORE: 6,
  LT: 7,
  GT: 8,
  EQ: 9,
  AND: 10,
  OR: 11,
  JMP_IF_FALSE: 12,
  JMP: 13,
  LIST: 14,
  LEN: 15,
  NTH: 16,
  RANGE: 17,
  MAP: 18,
  RETURN: 19,
  FILTER: 20,
  REDUCE: 21
};

function compileSharedBytecode(ast) {
  const names = [];
  const fnDefs = new Map();
  const program = { code: [], map_funcs: [], filter_funcs: [], reduce_funcs: [] };

  function getSlot(name) {
    const idx = names.indexOf(name);
    if (idx !== -1) return idx;
    names.push(name);
    return names.length - 1;
  }

  function emit(out, op, a = 0) {
    out.push({ op, a });
  }

  function defineFn(name, fnNode) {
    if (!isCallName(fnNode, "fn") || fnNode.args.length !== 2) {
      throw new Error("invalid fn definition");
    }
    const params = extractParams(fnNode.args[0]);
    fnDefs.set(name, { params, body: fnNode.args[1] });
  }

  function compileMapFunction(fnNode) {
    let paramName = null;
    let bodyNode = null;

    if (fnNode.type === "identifier") {
      const fn = fnDefs.get(fnNode.name);
      if (!fn) throw new Error(`unknown map function: ${fnNode.name}`);
      if (fn.params.length !== 1) throw new Error("map function must take exactly 1 arg");
      paramName = fn.params[0];
      bodyNode = fn.body;
    } else if (isCallName(fnNode, "fn") && fnNode.args.length === 2) {
      const params = extractParams(fnNode.args[0]);
      if (params.length !== 1) throw new Error("inline map fn must take exactly 1 arg");
      paramName = params[0];
      bodyNode = fnNode.args[1];
    } else {
      throw new Error("map expects fn or function name");
    }

    if (program.map_funcs.length >= 64) {
      throw new Error("too many map functions");
    }

    const mf = {
      param_slot: getSlot(paramName),
      code: []
    };

    compileExpr(bodyNode, mf.code);
    emit(mf.code, SHARED_OPS.RETURN, 0);

    const id = program.map_funcs.length;
    program.map_funcs.push(mf);
    return id;
  }

  function compileFilterFunction(fnNode) {
    let paramName = null;
    let bodyNode = null;

    if (fnNode.type === "identifier") {
      const fn = fnDefs.get(fnNode.name);
      if (!fn) throw new Error(`unknown filter function: ${fnNode.name}`);
      if (fn.params.length !== 1) throw new Error("filter function must take exactly 1 arg");
      paramName = fn.params[0];
      bodyNode = fn.body;
    } else if (isCallName(fnNode, "fn") && fnNode.args.length === 2) {
      const params = extractParams(fnNode.args[0]);
      if (params.length !== 1) throw new Error("inline filter fn must take exactly 1 arg");
      paramName = params[0];
      bodyNode = fnNode.args[1];
    } else {
      throw new Error("filter expects fn or function name");
    }

    if (program.filter_funcs.length >= 64) throw new Error("too many filter functions");

    const mf = { param_slot: getSlot(paramName), code: [] };
    compileExpr(bodyNode, mf.code);
    emit(mf.code, SHARED_OPS.RETURN, 0);

    const id = program.filter_funcs.length;
    program.filter_funcs.push(mf);
    return id;
  }

  function compileReduceFunction(fnNode) {
    let accName = null;
    let itemName = null;
    let bodyNode = null;

    if (fnNode.type === "identifier") {
      const fn = fnDefs.get(fnNode.name);
      if (!fn) throw new Error(`unknown reduce function: ${fnNode.name}`);
      if (fn.params.length !== 2) throw new Error("reduce function must take exactly 2 args");
      accName  = fn.params[0];
      itemName = fn.params[1];
      bodyNode = fn.body;
    } else if (isCallName(fnNode, "fn") && fnNode.args.length === 2) {
      const params = extractParams(fnNode.args[0]);
      if (params.length !== 2) throw new Error("inline reduce fn must take exactly 2 args");
      accName  = params[0];
      itemName = params[1];
      bodyNode = fnNode.args[1];
    } else {
      throw new Error("reduce expects fn or function name");
    }

    if (program.reduce_funcs.length >= 64) throw new Error("too many reduce functions");

    const rf = { acc_slot: getSlot(accName), item_slot: getSlot(itemName), code: [] };
    compileExpr(bodyNode, rf.code);
    emit(rf.code, SHARED_OPS.RETURN, 0);

    const id = program.reduce_funcs.length;
    program.reduce_funcs.push(rf);
    return id;
  }

  function compileExpr(node, out) {
    if (!node) throw new Error("missing node");

    if (node.type === "number") {
      emit(out, SHARED_OPS.CONST, node.value | 0);
      return;
    }

    if (node.type === "identifier") {
      emit(out, SHARED_OPS.LOAD, getSlot(node.name));
      return;
    }

    if (node.type !== "call" || !node.callee || node.callee.type !== "identifier") {
      throw new Error("invalid call");
    }

    const op = node.callee.name;

    if (compileIfCall(node, out, compileExpr, (condition, thenNode, elseNode, target, compileNode) => {
      compileNode(condition, target);
      const jmpFalseAt = target.length;
      emit(target, SHARED_OPS.JMP_IF_FALSE, 0);

      compileNode(thenNode, target);
      const jmpEndAt = target.length;
      emit(target, SHARED_OPS.JMP, 0);

      target[jmpFalseAt].a = target.length;
      compileNode(elseNode, target);
      target[jmpEndAt].a = target.length;
    })) {
      return;
    }

    if (op === "begin") {
      compileSequence(node.args, out, compileExpr);
      return;
    }

    if (op === "let") {
      const binding = getLetBinding(node);

      if (isCallName(binding.value, "fn")) {
        defineFn(binding.name, binding.value);
        return;
      }

      compileExpr(binding.value, out);
      emit(out, SHARED_OPS.STORE, getSlot(binding.name));
      return;
    }

    if (compileListCall(node, out, compileExpr, (target, count) => emit(target, SHARED_OPS.LIST, count))) {
      return;
    }

    if (compileHigherOrderCall(node, out, compileExpr, { name: "map", argCount: 2 }, ({ fnNode, listNode }, target, compileNode) => {
      const fnId = compileMapFunction(fnNode);
      compileNode(listNode, target);
      emit(target, SHARED_OPS.MAP, fnId);
    })) {
      return;
    }

    if (compileHigherOrderCall(node, out, compileExpr, { name: "filter", argCount: 2 }, ({ fnNode, listNode }, target, compileNode) => {
      const fnId = compileFilterFunction(fnNode);
      compileNode(listNode, target);
      emit(target, SHARED_OPS.FILTER, fnId);
    })) {
      return;
    }

    if (compileHigherOrderCall(node, out, compileExpr, { name: "reduce", argCount: 3 }, ({ fnNode, initNode, listNode }, target, compileNode) => {
      const fnId = compileReduceFunction(fnNode);
      compileNode(initNode, target);
      compileNode(listNode, target);
      emit(target, SHARED_OPS.REDUCE, fnId);
    })) {
      return;
    }

    if (compileUnaryOpCall(node, out, compileExpr, SHARED_UNARY_OPS, (target, op) => emit(target, op, 0))) {
      return;
    }

    if (compileBinaryOpCall(node, out, compileExpr, SHARED_BINARY_OPS, (target, op) => emit(target, op, 0))) {
      return;
    }

    const fn = fnDefs.get(op);
    if (!fn) {
      throw new Error(`unknown compile op: ${op}`);
    }

    const argCount = node.args.length;
    if (argCount !== fn.params.length) {
      throw new Error(`wrong arg count for ${op}: expected ${fn.params.length} got ${argCount}`);
    }

    for (let i = 0; i < argCount; i++) {
      compileExpr(node.args[i], out);
    }

    for (let i = argCount - 1; i >= 0; i--) {
      emit(out, SHARED_OPS.STORE, getSlot(fn.params[i]));
    }

    compileExpr(fn.body, out);
  }

  if (!ast || ast.type !== "program" || !Array.isArray(ast.body) || ast.body.length === 0) {
    throw new Error("empty program");
  }

  compileExpr(ast.body[0], program.code);
  emit(program.code, SHARED_OPS.RETURN, 0);

  return {
    version: "SIMLA_BC1",
    code: program.code,
    map_funcs:    program.map_funcs,
    filter_funcs: program.filter_funcs,
    reduce_funcs: program.reduce_funcs
  };
}

function serializeSharedBytecode(program) {
  if (!program || program.version !== "SIMLA_BC1") {
    throw new Error("invalid shared bytecode program");
  }

  const lines = [];
  lines.push("SIMLA_BC1");
  lines.push(`code_count ${program.code.length}`);

  for (const ins of program.code) {
    lines.push(`${ins.op} ${ins.a | 0}`);
  }

  const mapFuncs = Array.isArray(program.map_funcs) ? program.map_funcs : [];
  lines.push(`map_func_count ${mapFuncs.length}`);

  for (const mf of mapFuncs) {
    lines.push(`map_param_slot ${mf.param_slot | 0}`);
    lines.push(`map_code_count ${mf.code.length}`);

    for (const ins of mf.code) {
      lines.push(`${ins.op} ${ins.a | 0}`);
    }
  }

  const filterFuncs = Array.isArray(program.filter_funcs) ? program.filter_funcs : [];
  lines.push(`filter_func_count ${filterFuncs.length}`);

  for (const mf of filterFuncs) {
    lines.push(`filter_param_slot ${mf.param_slot | 0}`);
    lines.push(`filter_code_count ${mf.code.length}`);

    for (const ins of mf.code) {
      lines.push(`${ins.op} ${ins.a | 0}`);
    }
  }

  const reduceFuncs = Array.isArray(program.reduce_funcs) ? program.reduce_funcs : [];
  lines.push(`reduce_func_count ${reduceFuncs.length}`);

  for (const rf of reduceFuncs) {
    lines.push(`reduce_acc_slot ${rf.acc_slot | 0}`);
    lines.push(`reduce_item_slot ${rf.item_slot | 0}`);
    lines.push(`reduce_code_count ${rf.code.length}`);

    for (const ins of rf.code) {
      lines.push(`${ins.op} ${ins.a | 0}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export { compile, compileSharedBytecode, serializeSharedBytecode };
