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

  function expectArgs(node, name, count) {
    if (!node.args || node.args.length !== count) {
      throw new Error(`${name} expects ${count} args`);
    }
  }

  function isCallName(node, name) {
    return node && node.type === "call" && node.callee && node.callee.name === name;
  }

  function extractParams(paramsNode) {
    if (!paramsNode) throw new Error("missing params node");
    if (paramsNode.type === "list") {
      return paramsNode.elements.map((p) => {
        if (!p || p.type !== "identifier") throw new Error("function params must be symbols");
        return p.name;
      });
    }
    // Multi-arg: parser sees (acc x) as call{callee:acc, args:[x]}
    if (paramsNode.type === "call") {
      return [paramsNode.callee.name, ...paramsNode.args.map((a) => {
        if (!a || a.type !== "identifier") throw new Error("function params must be symbols");
        return a.name;
      })];
    }
    // Single bare identifier
    if (paramsNode.type === "identifier") return [paramsNode.name];
    throw new Error("function params must be list");
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

    if (op === "if") {
      expectArgs(node, "if", 3);

      compileExpr(node.args[0], out);
      const jmpFalseAt = out.length;
      emit(out, SHARED_OPS.JMP_IF_FALSE, 0);

      compileExpr(node.args[1], out);
      const jmpEndAt = out.length;
      emit(out, SHARED_OPS.JMP, 0);

      out[jmpFalseAt].a = out.length;
      compileExpr(node.args[2], out);
      out[jmpEndAt].a = out.length;
      return;
    }

    if (op === "begin") {
      for (const arg of node.args) compileExpr(arg, out);
      return;
    }

    if (op === "let") {
      expectArgs(node, "let", 2);
      if (!node.args[0] || node.args[0].type !== "identifier") {
        throw new Error("invalid let");
      }

      const name = node.args[0].name;
      const value = node.args[1];

      if (isCallName(value, "fn")) {
        defineFn(name, value);
        return;
      }

      compileExpr(value, out);
      emit(out, SHARED_OPS.STORE, getSlot(name));
      return;
    }

    if (op === "range") {
      expectArgs(node, "range", 2);
      compileExpr(node.args[0], out);
      compileExpr(node.args[1], out);
      emit(out, SHARED_OPS.RANGE, 0);
      return;
    }

    if (op === "list") {
      for (const arg of node.args) compileExpr(arg, out);
      emit(out, SHARED_OPS.LIST, node.args.length);
      return;
    }

    if (op === "map") {
      expectArgs(node, "map", 2);
      const fnId = compileMapFunction(node.args[0]);
      compileExpr(node.args[1], out);
      emit(out, SHARED_OPS.MAP, fnId);
      return;
    }

    if (op === "filter") {
      expectArgs(node, "filter", 2);
      const fnId = compileFilterFunction(node.args[0]);
      compileExpr(node.args[1], out);
      emit(out, SHARED_OPS.FILTER, fnId);
      return;
    }

    if (op === "reduce") {
      expectArgs(node, "reduce", 3);
      const fnId = compileReduceFunction(node.args[0]);
      compileExpr(node.args[1], out);  // init / acc
      compileExpr(node.args[2], out);  // list
      emit(out, SHARED_OPS.REDUCE, fnId);
      return;
    }

    if (op === "len") {
      expectArgs(node, "len", 1);
      compileExpr(node.args[0], out);
      emit(out, SHARED_OPS.LEN, 0);
      return;
    }

    if (op === "nth") {
      expectArgs(node, "nth", 2);
      compileExpr(node.args[0], out);
      compileExpr(node.args[1], out);
      emit(out, SHARED_OPS.NTH, 0);
      return;
    }

    if (["add", "sub", "mul", "div", "lt", "gt", "eq", "and", "or"].includes(op)) {
      expectArgs(node, op, 2);
      compileExpr(node.args[0], out);
      compileExpr(node.args[1], out);

      const opMap = {
        add: SHARED_OPS.ADD,
        sub: SHARED_OPS.SUB,
        mul: SHARED_OPS.MUL,
        div: SHARED_OPS.DIV,
        lt: SHARED_OPS.LT,
        gt: SHARED_OPS.GT,
        eq: SHARED_OPS.EQ,
        and: SHARED_OPS.AND,
        or: SHARED_OPS.OR
      };

      emit(out, opMap[op], 0);
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
