function parse(tokens) {
  let i = 0;

  function walk() {
    const token = tokens[i++];

    if (token === "(") {
      if (tokens[i] === ")") {
        i++;
        return { type: "list", elements: [] };
      }

      const elements = [];

      while (tokens[i] !== ")") {
        elements.push(walk());
      }

      i++; // consume ')'

      // 🔥 FIX:
      // only treat as CALL if it clearly has arguments
      if (
        elements.length >= 1 &&
        elements[0].type === "identifier"
      ) {
        return {
          type: "call",
          callee: elements[0],
          args: elements.slice(1)
        };
      }

      // otherwise it's a LIST (important for (e))
      return {
        type: "list",
        elements
      };
    }

    if (!isNaN(token)) {
      return { type: "number", value: Number(token) };
    }

    if (token.startsWith('"')) {
      return { type: "string", value: token.slice(1, -1) };
    }

    return { type: "identifier", name: token };
  }

  const body = [];
  while (i < tokens.length) {
    body.push(walk());
  }

  return { type: "program", body };
}

export { parse };
