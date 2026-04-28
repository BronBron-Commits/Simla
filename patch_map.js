case "MAP": {
  const list = stack.pop();
  const fn = stack.pop();

  if (!Array.isArray(list)) {
    stack.push([]);
    break;
  }

  const result = [];

  for (const item of list) {
    const newEnv = makeEnv(fn.closure);
    newEnv.vars[fn.params[0]] = item;

    const value = exec(fn.body, newEnv);

    // 🔥 FIX: preserve original if function returns nothing
    result.push(value === undefined ? item : value);
  }

  stack.push(result);
  break;
}
