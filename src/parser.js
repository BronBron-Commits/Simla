function parse(tokens) {
  let current = 0;

  function walk() {
    let token = tokens[current];

    if (token === "(") {
      current++;
      const node = {
        type: "call",
        name: tokens[current++],
        args: []
      };

      while (tokens[current] !== ")") {
        node.args.push(walk());
      }

      current++; // skip ')'
      return node;
    }

    if (!isNaN(token)) {
      current++;
      return { type: "number", value: Number(token) };
    }

    current++;
    return { type: "identifier", name: token };
  }

  return walk();
}

module.exports = { parse };
