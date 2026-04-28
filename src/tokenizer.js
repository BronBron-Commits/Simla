function tokenize(code) {
  return code
    .replace(/;;.*$/gm, "")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/\(/g, " ( ")
    .replace(/\)/g, " ) ")
    .match(/"[^"]*"|\S+/g)
    .filter(Boolean);
}

export { tokenize };
