import http from "http";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

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

  let filePath = "." + (url.pathname === "/" ? "/index.html" : url.pathname);

  const ext = path.extname(filePath);

  const map = {
    ".js": "text/javascript",
    ".html": "text/html",
    ".mc": "text/plain"
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
    } else {
      res.writeHead(200, { "Content-Type": map[ext] || "text/plain", "Cache-Control": "no-store" });
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
