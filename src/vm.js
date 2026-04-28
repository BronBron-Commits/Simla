function run(bytecode) {
  const stack = [];
  const env = {};

  let ip = 0;

  while (ip < bytecode.length) {
    const [op, a] = bytecode[ip];

    switch (op) {

      case "PUSH":
        stack.push(a);
        break;

      case "LOAD":
        if (!(a in env)) throw new Error("Undefined: " + a);
        stack.push(env[a]);
        break;

      case "STORE":
        env[a] = stack.pop();
        break;

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
        break;
      }

      case "JMP_IF_FALSE":
        if (!stack.pop()) {
          ip = a;
          continue;
        }
        break;

      case "JMP":
        ip = a;
        continue;

      default:
        throw new Error("Unknown op: " + op);
    }

    ip++;
  }

  return stack.pop();
}

module.exports = { run };
