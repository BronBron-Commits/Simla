let GLOBAL_ENV = null;

function makeEnv(parent = null) {
  return { vars: {}, parent };
}

function lookup(env, name) {
  let cur = env;
  while (cur) {
    if (name in cur.vars) return cur.vars[name];
    cur = cur.parent;
  }
  return 0;
}

function exec(code, env) {
  const stack = [];
  let ip = 0;

  while (ip < code.length) {
    const [op, a, b] = code[ip++];

    switch (op) {

      case "PUSH": stack.push(a); break;
      case "LOAD": stack.push(lookup(env, a)); break;
      case "STORE": env.vars[a] = stack.pop(); break;
      case "POP": stack.pop(); break;

      case "ADD":
 stack.push(stack.pop() + stack.pop()); break;

      case "SUB": {
        const y = stack.pop();
        const x = stack.pop();
        stack.push(x - y);
        break;
      }

      case "MUL": stack.push(stack.pop() * stack.pop()); break;

      // ✅ ADD THIS BACK
      case "OR": {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a || b);
        break;
      }

      
        case "GT": {
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a > b);
          break;
        }


        case "AND": {
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a && b);
          break;
        }

        case "NOT": {
          const a = stack.pop();
          stack.push(!a);
          break;
        }

case "LIST": {
        const arr = [];
        for (let i = 0; i < a; i++) arr.unshift(stack.pop());
        stack.push(arr);
        break;
      }

      case "GET": {
        const key = stack.pop();
        const obj = stack.pop();

        let val = 0;
        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i += 2) {
            if (obj[i] === key) {
              val = obj[i + 1];
              break;
            }
          }
        }

        stack.push(val);
        break;
      }

      case "SET": {
        const value = stack.pop();
        const key = stack.pop();
        const obj = stack.pop();

        const newObj = Array.isArray(obj) ? [...obj] : [];

        let found = false;
        for (let i = 0; i < newObj.length; i += 2) {
          if (newObj[i] === key) {
            newObj[i + 1] = value;
            found = true;
            break;
          }
        }

        if (!found) newObj.push(key, value);

        stack.push(newObj);
        break;
      }

      case "FN":
        stack.push({ params: a, body: b, closure: env });
        break;

      case "MAP": {
        const fn = stack.pop();
        const list = stack.pop();

        if (!Array.isArray(list)) {
          stack.push([]);
          break;
        }

        const result = [];

        for (const item of list) {
          const newEnv = makeEnv(fn.closure);
          newEnv.vars[fn.params[0]] = item;

          const value = exec(fn.body, newEnv);
          result.push(value);
        }

        stack.push(result);
        break;
      }

      
      case "FILTER": {
        const fn = stack.pop();
        const list = stack.pop();

        if (!Array.isArray(list)) {
          stack.push([]);
          break;
        }

        const result = [];

        for (const item of list) {
          const newEnv = makeEnv(fn.closure);
          newEnv.vars[fn.params[0]] = item;
          const keep = exec(fn.body, newEnv);

          if (keep) result.push(item);
        }

        stack.push(result);
        break;
      }


      case "REDUCE": {
        const fn = stack.pop();
        let acc = stack.pop();
        const list = stack.pop();

        if (!Array.isArray(list)) {
          stack.push(acc);
          break;
        }

        for (const item of list) {
          const newEnv = makeEnv(fn.closure);
          newEnv.vars[fn.params[0]] = acc;
          newEnv.vars[fn.params[1]] = item;
          acc = exec(fn.body, newEnv);
        }

        stack.push(acc);
        break;
      }


      case "IF": {
        const cond = stack.pop();
        const branch = cond ? a : b;
        const result = exec(branch, makeEnv(env));
        stack.push(result);
        break;
      }


      case "APPEND": {
        const item = stack.pop();
        const list = stack.pop();
        stack.push(Array.isArray(list) ? [...list, item] : [item]);
        break;
      }


      case "TYPE": {
        const value = stack.pop();

        if (Array.isArray(value)) {
          stack.push("list");
        } else if (typeof value === "number") {
          stack.push("number");
        } else if (typeof value === "string") {
          stack.push("string");
        } else if (value && Array.isArray(value.params)) {
          stack.push("function");
        } else {
          stack.push("unknown");
        }

        break;
      }

      case "LEN": {
        const v = stack.pop();
        stack.push(Array.isArray(v) || typeof v === "string" ? v.length : 0);
        break;
      }

      case "STRLEN": {
        const v = stack.pop();
        stack.push(typeof v === "string" ? v.length : 0);
        break;
      }

      case "CHARAT": {
        const index = stack.pop();
        const str = stack.pop();
        stack.push(typeof str === "string" ? (str[index] ?? "") : "");
        break;
      }

      case "SUBSTR": {
        const end = stack.pop();
        const start = stack.pop();
        const str = stack.pop();
        stack.push(typeof str === "string" ? str.slice(start, end) : "");
        break;
      }

      case "STRCAT": {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(String(a) + String(b));
        break;
      }

      case "TONUMBER": {
        const v = stack.pop();
        const n = Number(v);
        stack.push(Number.isFinite(n) ? n : 0);
        break;
      }


      case "CONCAT": {
        const b = stack.pop();
        const a = stack.pop();
        const aa = Array.isArray(a) ? a : [];
        const bb = Array.isArray(b) ? b : [];
        stack.push([...aa, ...bb]);
        break;
      }


      case "NTH": {
        const index = stack.pop();
        const list = stack.pop();
        if (Array.isArray(list)) stack.push(list[index] ?? 0);
        else if (typeof list === "string") stack.push(list[index] ?? "");
        else stack.push(0);
        break;
      }


      case "DEBUG": {
        const value = stack.pop();
        console.log("DEBUG", JSON.stringify(value));
        stack.push(value);
        break;
      }


      case "SIN": {
        const a = stack.pop();
        stack.push(Math.sin(a));
        break;
      }

      case "COS": {
        const a = stack.pop();
        stack.push(Math.cos(a));
        break;
      }

      case "SQRT": {
        const a = stack.pop();
        stack.push(Math.sqrt(a));
        break;
      }

      case "ATAN2": {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(Math.atan2(a, b));
        break;
      }

      case "ABS": {
        const a = stack.pop();
        stack.push(Math.abs(a));
        break;
      }


        case "DAMAGE_ALL": {
          const tick = stack.pop() | 0;
          const list = stack.pop();

          if (!Array.isArray(list)) {
            stack.push(list);
            break;
          }

          const get = (e, key) => {
            for (let i = 0; i < e.length; i += 2) {
              if (e[i] === key) return e[i + 1];
            }
            return 0;
          };

          const set = (e, key, value) => {
            const out = [...e];
            for (let i = 0; i < out.length; i += 2) {
              if (out[i] === key) { out[i + 1] = value; return out; }
            }
            out.push(key, value);
            return out;
          };

          const next = list.map(e => [...e]);

          for (const attacker of list) {
            if (get(attacker, "hp") <= 0) continue;

            const team = get(attacker, "team");
            const id = get(attacker, "id");
            const atk = get(attacker, "attack") || 1;

            const targets = [];
            for (let i = 0; i < next.length; i++) {
              const t = next[i];
              if (get(t, "team") !== team && get(t, "hp") > 0) {
                targets.push(i);
              }
            }

            if (targets.length === 0) continue;

            const pick = (id * 31 + tick * 17) % targets.length;
            const ti = targets[pick];

            const tgt = next[ti];
            const newHp = get(tgt, "hp") - atk;
            next[ti] = set(tgt, "hp", newHp);
          }

          const alive = next.filter(e => get(e, "hp") > 0);
          stack.push(alive);
          break;
        }

  
        case "BATTLE_REPORT": {
          const initialEnemyHp = stack.pop();
          const initialPlayerHp = stack.pop();
          const ticks = stack.pop();
          const list = stack.pop();

          const get = (e, key) => {
            for (let i = 0; i < e.length; i += 2) {
              if (e[i] === key) return e[i + 1];
            }
            return 0;
          };

          const players = Array.isArray(list)
            ? list.filter(e => get(e, "team") === "player")
            : [];

          const enemies = Array.isArray(list)
            ? list.filter(e => get(e, "team") === "enemy")
            : [];

          const playerHp = players.reduce((sum, e) => sum + get(e, "hp"), 0);
          const enemyHp = enemies.reduce((sum, e) => sum + get(e, "hp"), 0);

          stack.push([
            "ticks", ticks,
            "winner", players.length > 0 ? "players" : "enemies",
            "playersAlive", players.length,
            "enemiesAlive", enemies.length,
            "playerHpRemaining", playerHp,
            "enemyHpRemaining", enemyHp,
            "playerDamageTaken", initialPlayerHp - playerHp,
            "enemyDamageTaken", initialEnemyHp - enemyHp
          ]);
          break;
        }

  

        case "LT": {
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a < b ? 1 : 0);
          break;
        }

        case "GT": {
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a > b ? 1 : 0);
          break;
        }

        case "EQ": {
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a === b ? 1 : 0);
          break;
        }

        case "CALL": {
          const argCount = a;
          const args = [];

          for (let i = 0; i < argCount; i++) {
            args.unshift(stack.pop());
          }

          const fn = stack.pop();

          if (!fn || !Array.isArray(fn.params)) {
            throw new Error("Tried to call non-function");
          }

          const newEnv = makeEnv(fn.closure);

          for (let i = 0; i < fn.params.length; i++) {
            newEnv.vars[fn.params[i]] = args[i];
          }

          stack.push(exec(fn.body, newEnv));
          break;
        }


  
        case "EMPTY": {
          const v = stack.pop();
          stack.push(Array.isArray(v) ? v.length === 0 : !v);
          break;
        }


  
        case "SLICE": {
          const start = stack.pop();
          const list = stack.pop();
          stack.push(Array.isArray(list) ? list.slice(start) : []);
          break;
        }


  
        case "HERO": {
          const subtitle = stack.pop();
          const title = stack.pop();
          stack.push(["type", "hero", "title", title, "subtitle", subtitle]);
          break;
        }

        case "CARD": {
          const body = stack.pop();
          const title = stack.pop();
          stack.push(["title", title, "body", body]);
          break;
        }

        case "CARDS": {
          const items = stack.pop();
          stack.push(["type", "cards", "items", items]);
          break;
        }

        case "CODE": {
          const body = stack.pop();
          stack.push(["type", "code", "body", body]);
          break;
        }

        case "PAGE": {
          const sections = stack.pop();
          stack.push(["type", "page", "sections", sections]);
          break;
        }


  
        case "BUTTON": {
          const href = stack.pop();
          const label = stack.pop();
          stack.push(["type", "button", "label", label, "href", href]);
          break;
        }

        case "THEME": {
          const accent = stack.pop();
          const mode = stack.pop();
          stack.push(["type", "theme", "mode", mode, "accent", accent]);
          break;
        }


  
        case "RANGE": {
          const end = stack.pop();
          const start = stack.pop();
          const out = [];
          for (let i = start; i < end; i++) out.push(i);
          stack.push(out);
          break;
        }

        case "FLATTEN": {
          const list = stack.pop();
          if (!Array.isArray(list)) {
            stack.push([]);
            break;
          }
          stack.push(list.flat());
          break;
        }


  
        case "LTE": {
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a <= b);
          break;
        }

        case "GTE": {
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a >= b);
          break;
        }


  default:
        if (op === "DIV") {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(Math.floor(a / b));
      continue;
    }

    if (op === "MOD") {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(a % b);
      continue;
    }

    throw new Error("Unknown op: " + op);
    }
  }

  return stack.pop();
}

function run(bytecode, input = {}) {
  if (!GLOBAL_ENV) GLOBAL_ENV = makeEnv();

  Object.assign(GLOBAL_ENV.vars, input);

  const result = exec(bytecode, GLOBAL_ENV);

  return {
    result,
    state: GLOBAL_ENV.vars
  };
}

function execSharedBytecode(code, owner, vars) {
  const stack = [];
  const lists = [];
  let ip = 0;

  while (ip < code.length) {
    const ins = code[ip++];

    switch (ins.op) {
      case 0:
        stack.push(ins.a);
        break;

      case 1: {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a + b);
        break;
      }

      case 2: {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a - b);
        break;
      }

      case 3: {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a * b);
        break;
      }

      case 4: {
        const b = stack.pop();
        const a = stack.pop();
        if (b === 0) throw new Error("division by zero");
        stack.push(Math.trunc(a / b));
        break;
      }

      case 5:
        stack.push(vars[ins.a] || 0);
        break;

      case 6:
        vars[ins.a] = stack.pop();
        break;

      case 7: {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a < b ? 1 : 0);
        break;
      }

      case 8: {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a > b ? 1 : 0);
        break;
      }

      case 9: {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a === b ? 1 : 0);
        break;
      }

      case 10: {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a !== 0 && b !== 0 ? 1 : 0);
        break;
      }

      case 11: {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a !== 0 || b !== 0 ? 1 : 0);
        break;
      }

      case 12: {
        const cond = stack.pop();
        if (!cond) ip = ins.a;
        break;
      }

      case 13:
        ip = ins.a;
        break;

      case 14: {
        const count = ins.a;
        const id = lists.length;
        const out = new Array(count);

        for (let i = count - 1; i >= 0; i--) {
          out[i] = stack.pop();
        }

        lists.push(out);
        stack.push(-id - 1);
        break;
      }

      case 15: {
        const handle = stack.pop();
        const id = -handle - 1;
        const list = lists[id] || [];
        stack.push(list.length);
        break;
      }

      case 16: {
        const idx = stack.pop();
        const handle = stack.pop();
        const id = -handle - 1;
        const list = lists[id] || [];

        if (idx < 0 || idx >= list.length) {
          throw new Error("nth index out of bounds");
        }

        stack.push(list[idx]);
        break;
      }

      case 17: {
        const end = stack.pop();
        const start = stack.pop();
        const id = lists.length;
        const out = [];

        if (end >= start) {
          for (let v = start; v < end; v++) out.push(v);
        } else {
          for (let v = start; v > end; v--) out.push(v);
        }

        lists.push(out);
        stack.push(-id - 1);
        break;
      }

      case 18: {
        const handle = stack.pop();
        const srcId = -handle - 1;
        const src = lists[srcId] || [];

        if (ins.a < 0 || ins.a >= owner.map_funcs.length) {
          throw new Error("invalid map function id");
        }

        const fn = owner.map_funcs[ins.a];
        const outId = lists.length;
        const mapped = [];

        for (const item of src) {
          const localVars = new Array(256).fill(0);
          localVars[fn.param_slot] = item;
          mapped.push(execSharedBytecode(fn.code, owner, localVars));
        }

        lists.push(mapped);
        stack.push(-outId - 1);
        break;
      }

      case 19:
        return stack.pop();

      case 20: {
        const handle = stack.pop();
        const srcId = -handle - 1;
        const src = lists[srcId] || [];

        if (ins.a < 0 || ins.a >= owner.filter_funcs.length) {
          throw new Error("invalid filter function id");
        }

        const fn = owner.filter_funcs[ins.a];
        const outId = lists.length;
        const filtered = [];

        for (const item of src) {
          const localVars = new Array(256).fill(0);
          localVars[fn.param_slot] = item;
          if (execSharedBytecode(fn.code, owner, localVars)) filtered.push(item);
        }

        lists.push(filtered);
        stack.push(-outId - 1);
        break;
      }

      case 21: {
        const handle = stack.pop();
        const srcId = -handle - 1;
        const src = lists[srcId] || [];
        let acc = stack.pop();

        if (ins.a < 0 || ins.a >= owner.reduce_funcs.length) {
          throw new Error("invalid reduce function id");
        }

        const rf = owner.reduce_funcs[ins.a];

        for (const item of src) {
          const localVars = new Array(256).fill(0);
          localVars[rf.acc_slot]  = acc;
          localVars[rf.item_slot] = item;
          acc = execSharedBytecode(rf.code, owner, localVars);
        }

        stack.push(acc);
        break;
      }

      default:
        throw new Error(`Unknown shared opcode: ${ins.op}`);
    }
  }

  return stack.length > 0 ? stack[stack.length - 1] : 0;
}

function runSharedBytecode(program) {
  if (!program || !Array.isArray(program.code)) {
    throw new Error("invalid shared bytecode program");
  }

  const owner = {
    code: program.code,
    map_funcs:    Array.isArray(program.map_funcs)    ? program.map_funcs    : [],
    filter_funcs: Array.isArray(program.filter_funcs) ? program.filter_funcs : [],
    reduce_funcs: Array.isArray(program.reduce_funcs) ? program.reduce_funcs : []
  };

  const vars = new Array(256).fill(0);
  return execSharedBytecode(owner.code, owner, vars);
}

export { run, runSharedBytecode };
