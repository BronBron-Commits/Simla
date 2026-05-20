import { typeOf } from "./value.js";

export function assertType(value, expected, context = "") {

  const actual = typeOf(value);

  if (actual !== expected) {

    throw new Error(
      "[VM TYPE ERROR] "
      + context
      + " expected="
      + expected
      + " actual="
      + actual
    );
  }
}
