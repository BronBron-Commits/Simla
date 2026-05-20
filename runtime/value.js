export const TYPES = {
  NUMBER:   "number",
  STRING:   "string",
  LIST:     "list",
  FUNCTION: "function",
  BOOLEAN:  "boolean",
  NULL:     "null",
  OBJECT:   "object"
};

export function num(value) {
  return { type: TYPES.NUMBER, value };
}

export function str(value) {
  return { type: TYPES.STRING, value };
}

export function bool(value) {
  return { type: TYPES.BOOLEAN, value: !!value };
}

export function list(value = []) {
  return { type: TYPES.LIST, value };
}

export function object(value = {}) {
  return { type: TYPES.OBJECT, value };
}

export function fn(params, body, closure = null) {
  return {
    type: TYPES.FUNCTION,
    params,
    body,
    closure
  };
}

export function nil() {
  return { type: TYPES.NULL, value: null };
}

export function typeOf(v) {
  if (!v) return "undefined";
  return v.type || typeof v;
}

export function unwrap(v) {
  if (v && typeof v === "object" && "value" in v) {
    return v.value;
  }
  return v;
}
