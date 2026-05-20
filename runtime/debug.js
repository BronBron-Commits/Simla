import { typeOf, unwrap } from "./value.js";

export function dumpStack(stack) {

  return stack.map((v, i) => {

    return {
      slot: i,
      type: typeOf(v),
      value: preview(v)
    };
  });
}

export function preview(v) {

  try {

    const raw = unwrap(v);

    if (Array.isArray(raw)) {
      return "[list len=" + raw.length + "]";
    }

    if (typeof raw === "object") {
      return JSON.stringify(raw).slice(0, 120);
    }

    return String(raw);

  } catch {

    return "[unprintable]";
  }
}

export function trace(ip, ins, stack) {

  console.log(
    "\n[TRACE]",
    "IP=" + ip,
    "OP=" + JSON.stringify(ins)
  );

  console.log(
    JSON.stringify(
      dumpStack(stack),
      null,
      2
    )
  );
}
