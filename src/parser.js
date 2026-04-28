function parse(tokens) {
  let current = 0;

  function walk() {
    let token = tokens[current];

    // string literal
    if (token.startsWith('"') && token.endsWith('"')) {
      current++;
      return {
        type: "string",
        value: token.slice(1, -1)
      };
    }

    if (token === "(") {
      current++;

      const callee = walk();

      const node = {
        type: "call",
        callee,
        args: []
      };

      while (tokens[current] !== ")") {
        node.args.push(walk());
      }

      current++;
      return node;
    }

    if (!isNaN(token)) {
      current++;
      return { type: "number", value: Number(token) };
    }

    current++;
    return { type: "identifier", name: token };
  }

  const program = { type: "program", body: [] };

  while (current < tokens.length) {
    program.body.push(walk());
  }

  return program;
}

export { parse };
