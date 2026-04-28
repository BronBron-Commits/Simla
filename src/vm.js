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
