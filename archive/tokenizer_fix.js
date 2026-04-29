function tokenize(code) {
  return code
    .replace(/;;.*$/gm, "")              // remove comments
    .replace(/[^\w\s\(\)\.\-\+"]/g, " ") // strip garbage (emojis, words)
    .replace(/\(/g, " ( ")
    .replace(/\)/g, " ) ")
    .match(/"[^"]*"|\S+/g)
    .filter(Boolean);
}

export { tokenize };
