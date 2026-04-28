function parse(tokens) {
  let i = 0;

  function walk() {
    let token = tokens[i++];

    if (token === "(") {
      // 🔥 EMPTY LIST FIX
      if (tokens[i] === ")") {
        i++; // consume ')'
        return { type: "list", elements: [] };
      }

      // parse first element
      const first = walk();

      const args = [];
      while (tokens[i] !== ")") {
        args.push(walk());
      }

      i++; // consume ')'

      // if first is identifier → function call
      if (first.type === "identifier") {
        return {
          type: "call",
          callee: first,
          args
        };
      }

      // otherwise it's just a list
      return {
        type: "list",
        elements: [first, ...args]
      };
    }

    // number
    if (!isNaN(token)) {
      return {
        type: "number",
        value: Number(token)
      };
    }

    // string
    if (token.startsWith('"')) {
      return {
        type: "string",
        value: token.slice(1, -1)
      };
    }

    // identifier
    return {
      type: "identifier",
      name: token
    };
  }

  const body = [];
  while (i < tokens.length) {
    body.push(walk());
  }

  return {
    type: "program",
    body
  };
}

export { parse };
