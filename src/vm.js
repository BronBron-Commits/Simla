
import { trace } from "../runtime/debug.js";

const VM_TRACE =
  typeof process !== "undefined"
  && process.env
  && process.env.SIMLA_TRACE === "1";

let GLOBAL_ENV = null;

function makeEnv(parent = null) {
  return { vars: {}, parent };
}

function lookup(env, name) {
  let cur = env;

  while (cur) {
    if (name in cur.vars) {
      return cur.vars[name];
    }

    cur = cur.parent;
  }

  throw new Error(
    "[VM] Undefined symbol: " + name
  );
}

function isSimlaObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value) && value.__simlaKind === "object";
}

function isSimlaNode(value) {
  return !!value && typeof value === "object" && !Array.isArray(value) && value.__simlaKind === "node";
}

function isSimlaTuple(value) {
  return !!value && typeof value === "object" && !Array.isArray(value) && value.__simlaKind === "tuple";
}

function keysEqual(a, b) {
  if (
    a &&
    b &&
    a.__simlaKind === "symbol" &&
    b.__simlaKind === "symbol"
  ) {
    return a.name === b.name;
  }

  return a === b;
}

function isPairList(value) {
  if (!Array.isArray(value) || value.length % 2 !== 0) return false;
  for (let i = 0; i < value.length; i += 2) {
    if (typeof value[i] !== "string") return false;
  }
  return true;
}

function makeObjectFromPairs(pairs) {
  const props = {};
  for (let i = 0; i < pairs.length; i += 2) {
    props[String(pairs[i])] = pairs[i + 1];
  }
  return { __simlaKind: "object", props };
}

function objectFromValue(value) {
  if (isSimlaObject(value)) return value;
  if (isPairList(value)) return makeObjectFromPairs(value);
  return { __simlaKind: "object", props: {} };
}

function kindOf(value) {
  if (value === null || value === undefined) return "nil";
  if (isSimlaNode(value)) return "node";
  if (isSimlaObject(value)) return "object";
  if (isSimlaTuple(value)) return value.tupleKind || "tuple";
  if (Array.isArray(value)) return "list";
  if (typeof value === "number") return "number";
  if (typeof value === "string") return "string";
  if (!!value && typeof value === "object" && value.__simlaKind === "symbol") return "symbol";
  if (typeof value === "boolean") return "boolean";
  if (value && Array.isArray(value.params)) return "function";
  return "unknown";
}

function getProperty(container, key) {
  const propKey = String(key);

  if (isSimlaObject(container)) {
    return container.props[propKey] ?? 0;
  }

  if (isSimlaNode(container)) {
    if (propKey === "kind") return container.kind;
    if (propKey === "children") return Array.isArray(container.children) ? container.children : [];
    return container.props[propKey] ?? 0;
  }

  if (isSimlaTuple(container)) {
    if (propKey === "x") return container.values[0] ?? 0;
    if (propKey === "y") return container.values[1] ?? 0;
    if (propKey === "z") return container.values[2] ?? 0;
  }

  if (isPairList(container)) {
    for (let i = 0; i < container.length; i += 2) {
      if (keysEqual(container[i], key)) return container[i + 1];
    }
  }

  return 0;
}

function setProperty(container, key, value) {
  const propKey = String(key);

  if (isSimlaObject(container)) {
    return {
      __simlaKind: "object",
      props: {
        ...container.props,
        [propKey]: value
      }
    };
  }

  if (isSimlaNode(container)) {
    return {
      __simlaKind: "node",
      kind: container.kind,
      props: {
        ...container.props,
        [propKey]: value
      },
      children: Array.isArray(container.children) ? [...container.children] : []
    };
  }

  const asObj = objectFromValue(container);
  return {
    __simlaKind: "object",
    props: {
      ...asObj.props,
      [propKey]: value
    }
  };
}

function exec(code, env) {
  const stack = [];
  let ip = 0;

  
while (ip < code.length) {

      if (VM_TRACE) {
        trace(ip, code[ip], stack);
      }

    const [op, a, b] = code[ip++];

    switch (op) {

      case "PUSH": stack.push(a); break;
      case "SYMBOL": stack.push({ __simlaKind: "symbol", name: a }); break;
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

      case "MIN": {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(Math.min(a, b));
        break;
      }

      case "MAX": {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(Math.max(a, b));
        break;
      }

      case "CLAMP": {
        const high = stack.pop();
        const low = stack.pop();
        const value = stack.pop();
        stack.push(Math.min(Math.max(value, low), high));
        break;
      }

      case "LERP": {
        const t = stack.pop();
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a + (b - a) * t);
        break;
      }

      case "INVLERP": {
        const b = stack.pop();
        const a = stack.pop();
        const value = stack.pop();
        stack.push((value - a) / (b - a));
        break;
      }

      case "REMAP": {
        const outMax = stack.pop();
        const outMin = stack.pop();
        const inMax = stack.pop();
        const inMin = stack.pop();
        const value = stack.pop();
        const t = (value - inMin) / (inMax - inMin);
        stack.push(outMin + (outMax - outMin) * t);
        break;
      }

      // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ ADD THIS BACK
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
            if (keysEqual(obj[i], key)) {
              val = obj[i + 1];
              break;
            }
          }
        }

        stack.push(val);
        break;
      }

      case "HAS": {
        const key = stack.pop();
        const obj = stack.pop();

        let found = 0;
        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i += 2) {
            if (keysEqual(obj[i], key)) {
              found = 1;
              break;
            }
          }
        }

        stack.push(found);
        break;
      }

      case "REMOVE": {
        const key = stack.pop();
        const obj = stack.pop();

        const result = [];

        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i += 2) {
            if (!keysEqual(obj[i], key)) {
              result.push(obj[i], obj[i + 1]);
            }
          }
        }

        stack.push(result);
        break;
      }

      case "KEYS": {
        const obj = stack.pop();
        const result = [];

        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i += 2) {
            result.push(obj[i]);
          }
        }

        stack.push(result);
        break;
      }

      case "VALUES": {
        const obj = stack.pop();
        const result = [];

        if (Array.isArray(obj)) {
          for (let i = 1; i < obj.length; i += 2) {
            result.push(obj[i]);
          }
        }

        stack.push(result);
        break;
      }

      case "COUNT": {
        const obj = stack.pop();

        if (Array.isArray(obj)) {
          stack.push(Math.floor(obj.length / 2));
        } else {
          stack.push(0);
        }

        break;
      }

      case "MERGE": {
        const b = stack.pop();
        const a = stack.pop();

        const result = Array.isArray(a) ? [...a] : [];

        if (Array.isArray(b)) {
          for (let i = 0; i < b.length; i += 2) {
            const key = b[i];
            const value = b[i + 1];

            let found = false;

            for (let j = 0; j < result.length; j += 2) {
              if (keysEqual(result[j], key)) {
                result[j + 1] = value;
                found = true;
                break;
              }
            }

            if (!found) {
              result.push(key, value);
            }
          }
        }

        stack.push(result);
        break;
      }

      case "ENTRIES": {
        const obj = stack.pop();
        const result = [];

        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i += 2) {
            result.push([
              obj[i],
              obj[i + 1]
            ]);
          }
        }

        stack.push(result);
        break;
      }

      case "SET": {
        const value = stack.pop();
        const key = stack.pop();
        const obj = stack.pop();

        const newObj = Array.isArray(obj) ? [...obj] : [];

        let found = false;
        for (let i = 0; i < newObj.length; i += 2) {
          if (keysEqual(newObj[i], key)) {
            newObj[i + 1] = value;
            found = true;
            break;
          }
        }

        if (!found) newObj.push(key, value);

        stack.push(newObj);
        break;
      }

      case "FN": {
          stack.push({ params: a, body: b, closure: env });
          break;
        }

      case "MAP": {
          const fn = stack.pop();
          const list = stack.pop();

        if (!Array.isArray(list)) {
          stack.push([]);
          break;
        }

        if (!fn || !Array.isArray(fn.params)) {
            throw new Error("MAP expected function");
          }

          if (!fn || !Array.isArray(fn.params)) {
            throw new Error("MAP expected function");
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

        stack.push(kindOf(value));
        break;
      }

      case "KIND": {
        const value = stack.pop();
        stack.push(kindOf(value));
        break;
      }

      case "SYMBOL_NAME": {
        const value = stack.pop();
        stack.push(
          value && value.__simlaKind === "symbol"
            ? value.name
            : ""
        );
        break;
      }

      case "IS_SYMBOL": {
        const value = stack.pop();
        stack.push(
          value && value.__simlaKind === "symbol"
            ? 1
            : 0
        );
        break;
      }

      case "IS_NODE": {
        const value = stack.pop();
        stack.push(isSimlaNode(value) ? 1 : 0);
        break;
      }

      case "CHILDREN": {
        const value = stack.pop();
        stack.push(isSimlaNode(value) ? [...value.children] : []);
        break;
      }

      case "OBJ": {
        const entries = new Array(a);
        for (let i = a - 1; i >= 0; i--) {
          entries[i] = stack.pop();
        }
        stack.push(makeObjectFromPairs(entries));
        break;
      }

      case "NODE": {
        const children = stack.pop();
        const props = stack.pop();
        const nodeKind = stack.pop();
        const propObj = objectFromValue(props);

        stack.push({
          __simlaKind: "node",
          kind: String(nodeKind),
          props: { ...propObj.props },
          children: Array.isArray(children) ? [...children] : []
        });
        break;
      }

      case "VEC3": {
        const z = stack.pop();
        const y = stack.pop();
        const x = stack.pop();
        stack.push({
          __simlaKind: "tuple",
          tupleKind: "vec3",
          values: [x, y, z]
        });
        break;
      }

      case "GETP": {
        const key = stack.pop();
        const container = stack.pop();
        stack.push(getProperty(container, key));
        break;
      }

      case "SETP": {
        const value = stack.pop();
        const key = stack.pop();
        const container = stack.pop();
        stack.push(setProperty(container, key, value));
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

          if (
            a &&
            b &&
            a.__simlaKind === "symbol" &&
            b.__simlaKind === "symbol"
          ) {
            stack.push(a.name === b.name ? 1 : 0);
          } else {
            stack.push(a === b ? 1 : 0);
          }

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
            console.error("\n=== CALL FAILURE ===");
            console.error("VALUE:");
            console.error(fn);

            console.error("\nSTACK:");
            console.error(
              JSON.stringify(
                stack,
                null,
                2
              )
            );

            throw new Error(
              "Tried to call non-function"
            );
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
          if (end >= start) {
            for (let i = start; i < end; i++) out.push(i);
          } else {
            for (let i = start; i > end; i--) out.push(i);
          }
          stack.push(out);
          break;
        }

        case "FLATTEN": {
          const list = stack.pop();
          if (isSimlaNode(list)) {
            throw new Error("flatten does not accept node values");
          }
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

  return result;
}

function emitSharedTrace(trace, depth, ip, ins, stack) {
  if (!trace) return;

  const top = stack.length > 0 ? String(stack[stack.length - 1]) : "EMPTY";
  trace(`TRACE depth=${depth} ip=${ip} op=${ins.op} a=${ins.a} sp=${stack.length} top=${top}`);
}

function execSharedBytecode(code, owner, vars, trace = null, depth = 0) {
  const stack = [];
  const lists = [];
  let ip = 0;

  
while (ip < code.length) {

      if (VM_TRACE) {
        trace(ip, code[ip], stack);
      }

    const currentIp = ip;
    const ins = code[ip++];

    emitSharedTrace(trace, depth, currentIp, ins, stack);

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
          mapped.push(execSharedBytecode(fn.code, owner, localVars, trace, depth + 1));
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
          if (execSharedBytecode(fn.code, owner, localVars, trace, depth + 1)) filtered.push(item);
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
          acc = execSharedBytecode(rf.code, owner, localVars, trace, depth + 1);
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

function runSharedBytecode(program, options = {}) {
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
  const trace = typeof options.trace === "function" ? options.trace : null;
  return execSharedBytecode(owner.code, owner, vars, trace, 0);
}

export { run, runSharedBytecode };
