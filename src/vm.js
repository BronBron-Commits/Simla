function run(bytecode, initialState = {}) {
  const stack = [];

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

  const env = makeEnv();
  Object.assign(env.vars, initialState);

  let ip = 0;

  while (ip < bytecode.length) {
    const [op, a] = bytecode[ip++];

    switch (op) {
      case "PUSH": stack.push(a); break;
      case "LOAD": stack.push(lookup(env, a)); break;
      case "STORE": env.vars[a] = stack.pop(); break;
      case "POP": stack.pop(); break;

      case "ADD": stack.push(stack.pop() + stack.pop()); break;

      case "SUB": {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a - b);
        break;
      }

      case "MUL": stack.push(stack.pop() * stack.pop()); break;

      case "DIV": {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a / b);
        break;
      }

      case "OR": stack.push(stack.pop() || stack.pop()); break;

      case "GT": {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a > b ? 1 : 0);
        break;
      }

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

      case "LIST": {
        const arr = [];
        for (let i = 0; i < a; i++) arr.unshift(stack.pop());
        stack.push(arr);
        break;
      }

      default:
        throw new Error("Unknown op: " + op);
    }
  }

  return {
    result: stack.pop(),
    state: env.vars
  };
}

export { run };
