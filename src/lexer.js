function tokenize(input) {
  return input
    .replace(/\(/g, " ( ")
    .replace(/\)/g, " ) ")
    .trim()
    .split(/\s+/);
}

module.exports = { tokenize };
