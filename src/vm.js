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

      case "ADD": stack.push(stack.pop() + stack.pop()); break;

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

        case "LT": {
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a < b);
          break;
        }

        case "EQ": {
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a === b);
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


      case "LEN": {
        const v = stack.pop();
        stack.push(Array.isArray(v) ? v.length : 0);
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
        stack.push(Array.isArray(list) ? list[index] ?? 0 : 0);
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


  default:
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

export { run };
