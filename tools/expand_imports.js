import fs from "fs";
import path from "path";

const entry = process.argv[2];

if (!entry) {
  console.error("Usage: node tools/expand_imports.js <file.sim>");
  process.exit(1);
}

const seen = new Set();

function stripOuterBegin(src) {
  const trimmed = src.trim();

  if (!trimmed.startsWith("(begin")) return trimmed;

  let depth = 0;
  let start = trimmed.indexOf("(begin") + "(begin".length;
  let end = trimmed.length - 1;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];

    if (ch === "(") depth++;
    if (ch === ")") depth--;

    if (depth === 0) {
      end = i;
      break;
    }
  }

  return trimmed.slice(start, end).trim();
}

function expandFile(filePath) {
  const abs = path.resolve(filePath);

  if (seen.has(abs)) return "";
  seen.add(abs);

  const dir = path.dirname(abs);
  let src = fs.readFileSync(abs, "utf8");

  src = src.replace(/\(import\s+"([^"]+)"\s*\)/g, (_, importPath) => {
    const resolved = path.resolve(dir, importPath);
    return stripOuterBegin(expandFile(resolved));
  });

  return src;
}

const expanded = expandFile(entry);
console.log(expanded);
