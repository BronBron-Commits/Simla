function run(bytecode) {
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
    throw new Error("Undefined: " + name);
  }

  const frames = [{
    code: bytecode,
    ip: 0,
    env: makeEnv()
  }];

  function step() {
    const frame = frames[frames.length - 1];

    if (frame.ip >= frame.code.length) {
      frames.pop();
      return;
    }

    const [op, a, b] = frame.code[frame.ip++];

    switch (op) {

      case "PUSH": stack.push(a); break;
      case "LOAD": stack.push(lookup(frame.env, a)); break;
      case "STORE": frame.env.vars[a] = stack.pop(); break;
      case "DUP": stack.push(stack[stack.length - 1]); break;
      case "POP": stack.pop(); break;

      case "MAKE_FUNC":
        stack.push({ params: a, code: b, closure: frame.env });
        break;

      case "CALL": {
        const args = [];
        for (let i = 0; i < a; i++) args.unshift(stack.pop());
        const fn = stack.pop();

        const newEnv = makeEnv(fn.closure);
        for (let i = 0; i < fn.params.length; i++) {
          newEnv.vars[fn.params[i]] = args[i];
        }

        frames.push({ code: fn.code, ip: 0, env: newEnv });
        break;
      }

      case "RET": {
        const val = stack.pop();
        frames.pop();
        if (frames.length) stack.push(val);
        break;
      }

      case "LIST": {
        const arr = [];
        for (let i = 0; i < a; i++) arr.unshift(stack.pop());
        stack.push(arr);
        break;
      }

      case "FIRST": stack.push(stack.pop()[0]); break;
      case "REST": stack.push(stack.pop().slice(1)); break;

      case "CONS": {
        const list = stack.pop();
        const val = stack.pop();
        stack.push([val, ...list]);
        break;
      }

      case "LEN": stack.push(stack.pop().length); break;

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

      case "EQ": stack.push(stack.pop() === stack.pop()); break;

      case "PRINT": {
        const val = stack.pop();
        console.log(val);
        stack.push(val);
        break;
      }

      case "JMP_IF_FALSE":
        if (!stack.pop()) frame.ip = a;
        break;

      case "JMP":
        frame.ip = a;
        break;

      case "MAP": {
        const list = stack.pop();
        const fn = stack.pop();
        const result = [];

        for (const item of list) {
          const newEnv = makeEnv(fn.closure);
          newEnv.vars[fn.params[0]] = item;

          frames.push({ code: fn.code, ip: 0, env: newEnv });

          while (frames.length > 1) {
            step();
          }

          result.push(stack.pop());
        }

        stack.push(result);
        break;
      }

      default:
        throw new Error("Unknown op: " + op);
    }
  }

  while (frames.length) {
    step();
  }

  return stack.pop();
}

module.exports = { run };
