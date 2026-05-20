import {
  num,
  str,
  list,
  fn,
  typeOf
} from "../value.js";

console.log(typeOf(num(5)));
console.log(typeOf(str("hello")));
console.log(typeOf(list([])));
console.log(typeOf(fn([], [])));
