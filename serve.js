import http from "http";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { parseRWX } from "./tools/parse_rwx.js";

const port = 8080;
const ROOT = process.cwd();
const START_TIME = Date.now();

function injectTick(src, tick) {
  const trimmed = src.trim();
  if (trimmed.startsWith("(begin")) {
    return trimmed.replace("(begin", `(begin\n  (let tick ${tick})`);
  }
  return `(begin\n  (let tick ${tick})\n  ${src}\n)`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);

  if (url.pathname === "/api/rwx") {
    try {
      const file = url.searchParams.get("file");
      if (!file) { res.writeHead(400); res.end(JSON.stringify({ error: "missing ?file=" })); return; }
      const abs = path.resolve(ROOT, file);
      // security: must stay inside project root
      if (!abs.startsWith(ROOT)) { res.writeHead(403); res.end(JSON.stringify({ error: "forbidden" })); return; }
      const src = fs.readFileSync(abs, "utf8");
      const objects = parseRWX(src);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(objects));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(err.message || err) }));
    }
    return;
  }

  if (url.pathname === "/api/scene") {
    try {
      const file = url.searchParams.get("file") || "examples/simla3d_demo.sim";
      fs.mkdirSync(path.join(ROOT, ".tmp"), { recursive: true });

      const expanded = execFileSync("node", ["tools/expand_imports.js", file], {
        cwd: ROOT,
        encoding: "utf8"
      });

      const tick = Date.now() - START_TIME;
      const withTick = injectTick(expanded, tick);
      const expandedPath = path.join(ROOT, ".tmp", "simla3d-expanded.sim");
      fs.writeFileSync(expandedPath, withTick);

      const output = execFileSync("node", ["tools/run_js_vm.js", expandedPath], {
        cwd: ROOT,
        encoding: "utf8"
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(output.trim());
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(err.message || err), stderr: String(err.stderr || "") }));
    }
    return;
  }

  // silence favicon
  if (url.pathname === "/favicon.ico") { res.writeHead(204); res.end(); return; }

  let filePath = "." + (url.pathname === "/" ? "/index.html" : url.pathname);

  const ext = path.extname(filePath);

  const map = {
    ".js":   "text/javascript",
    ".html": "text/html",
    ".mc":   "text/plain",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png":  "image/png",
    ".gif":  "image/gif",
    ".bmp":  "image/bmp"
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
    } else {
      res.writeHead(200, { "Content-Type": map[ext] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(content);
    }
  });
});

server.on("error", err => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} already in use. Kill the old process and try again.`);
    process.exit(1);
  } else {
    console.error("Server error:", err);
  }
});

process.on("uncaughtException", err => {
  console.error("Uncaught exception (server kept running):", err);
});

process.on("unhandledRejection", err => {
  console.error("Unhandled rejection (server kept running):", err);
});

server.listen(port, () => {
  console.log("Server running at http://localhost:" + port);
});
