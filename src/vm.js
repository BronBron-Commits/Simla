function run(bytecode, initialState = {}) {

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

        case "DIV": {
          const y = stack.pop();
          const x = stack.pop();
          stack.push(x / y);
          break;
        }

        case "MIN": {
          const y = stack.pop();
          const x = stack.pop();
          stack.push(Math.min(x, y));
          break;
        }

        case "MAX": {
          const y = stack.pop();
          const x = stack.pop();
          stack.push(Math.max(x, y));
          break;
        }

        case "OR": stack.push(stack.pop() || stack.pop()); break;

        case "LIST": {
          const arr = [];
          for (let i = 0; i < a; i++) arr.unshift(stack.pop());
          stack.push(arr);
          break;
        }

        // ✅ SAFE GET
        case "GET": {
          const key = stack.pop();
          const obj = stack.pop();

          if (!Array.isArray(obj)) {
            stack.push(0);
            break;
          }

          let found = false;

          for (let i = 0; i < obj.length; i += 2) {
            if (obj[i] === key) {
              stack.push(obj[i + 1]);
              found = true;
              break;
            }
          }

          if (!found) stack.push(0);
          break;
        }

        // ✅ SAFE SET
        case "SET": {
          const value = stack.pop();
          const key = stack.pop();
          const obj = stack.pop();

          if (!Array.isArray(obj)) {
            stack.push(obj);
            break;
          }

          const newObj = [...obj];
          let found = false;

          for (let i = 0; i < newObj.length; i += 2) {
            if (newObj[i] === key) {
              newObj[i + 1] = value;
              found = true;
              break;
            }
          }

          if (!found) {
            newObj.push(key, value);
          }

          stack.push(newObj);
          break;
        }

        case "FN":
          stack.push({
            params: a,
            body: b,
            closure: env
          });
          break;

        case "CALL": {
          const fn = stack.pop();

          if (!fn || !fn.params) {
            throw new Error("CALL on non-function: " + JSON.stringify(fn));
          }

          const args = [];
          for (let i = 0; i < a; i++) args.unshift(stack.pop());

          const newEnv = makeEnv(fn.closure);
          fn.params.forEach((p, i) => {
            newEnv.vars[p] = args[i];
          });

          stack.push(exec(fn.body, newEnv));
          break;
        }

        case "MAP": {
          const list = stack.pop();
          const fn = stack.pop();

          if (!Array.isArray(list)) {
            stack.push([]);
            break;
          }

          if (!fn || !fn.params) {
            throw new Error("MAP expected function, got " + JSON.stringify(fn));
          }

          const result = list.map(item => {
            if (item === undefined) return item;

            const newEnv = makeEnv(fn.closure);
            newEnv.vars[fn.params[0]] = item;

            return exec(fn.body, newEnv);
          });

          stack.push(result);
          break;
        }

        default:
          throw new Error("Unknown op: " + op);
      }
    }

    return stack.pop();
  }

  const env = makeEnv();
  Object.assign(env.vars, initialState);

  return {
    result: exec(bytecode, env),
    state: env.vars
  };
}

export { run };
