function run(bytecode) {
  const stack = [];

  const frames = [{
    code: bytecode,
    ip: 0,
    env: {}
  }];

  while (frames.length) {
    const frame = frames[frames.length - 1];
    const { code } = frame;

    if (frame.ip >= code.length) {
      frames.pop();
      continue;
    }

    const [op, a, b, c] = code[frame.ip++];

    switch (op) {

      case "PUSH":
        stack.push(a);
        break;

      case "LOAD":
        if (!(a in frame.env)) throw new Error("Undefined: " + a);
        stack.push(frame.env[a]);
        break;

      case "STORE":
        frame.env[a] = stack.pop();
        break;

      case "FUNC":
        // capture lexical environment HERE
        frame.env[a] = {
          params: b,
          code: c,
          closure: frame.env
        };
        break;

      case "CALL": {
        const fn = frame.env[a];
        if (!fn) throw new Error("Not a function: " + a);

        const args = [];
        for (let i = 0; i < b; i++) args.unshift(stack.pop());

        // USE captured closure, not caller env
        const newEnv = Object.create(fn.closure);

        for (let i = 0; i < fn.params.length; i++) {
          newEnv[fn.params[i]] = args[i];
        }

        frames.push({
          code: fn.code,
          ip: 0,
          env: newEnv
        });
        break;
      }

      case "RET": {
        const retVal = stack.pop();
        frames.pop();
        if (frames.length) {
          stack.push(retVal);
        }
        break;
      }

      case "ADD":
        stack.push(stack.pop() + stack.pop());
        break;

      case "SUB": {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a - b);
        break;
      }

      case "MUL":
        stack.push(stack.pop() * stack.pop());
        break;

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

      case "EQ":
        stack.push(stack.pop() === stack.pop());
        break;

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

      default:
        throw new Error("Unknown op: " + op);
    }
  }

  return stack.pop();
}

module.exports = { run };
