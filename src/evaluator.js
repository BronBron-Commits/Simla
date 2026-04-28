function evaluate(node) {
  if (node.type === "number") return node.value;

  if (node.type === "call") {
    const args = node.args.map(evaluate);

    switch (node.name) {
      case "add": return args[0] + args[1];
      case "sub": return args[0] - args[1];
      case "mul": return args[0] * args[1];
      case "div": return args[0] / args[1];
      case "print":
        console.log(args[0]);
        return args[0];
      default:
        throw new Error("Unknown function: " + node.name);
    }
  }

  throw new Error("Unknown node type");
}

module.exports = { evaluate };
