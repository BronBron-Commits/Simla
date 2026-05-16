import http from "http";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const PORT = Number(process.env.PORT || 8080);
const ROOT = process.cwd();
const START_TIME = Date.now();

function send(res, status, type, body) {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function safePath(urlPath) {
  const clean = urlPath.split("?")[0];
  const resolved = path.resolve(ROOT, "." + clean);
  if (!resolved.startsWith(ROOT)) return null;
  return resolved;
}

function injectTick(src, tick) {
  const trimmed = src.trim();

  if (trimmed.startsWith("(begin")) {
    return trimmed.replace("(begin", `(begin\n  (let tick ${tick})`);
  }

  return `(begin\n  (let tick ${tick})\n  ${src}\n)`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/api/scene") {
    try {
      const file = url.searchParams.get("file") || "examples/simla3d_demo.sim";
      const expandedPath = path.join(ROOT, ".tmp", "simla3d-expanded.sim");

      fs.mkdirSync(path.join(ROOT, ".tmp"), { recursive: true });

      const expanded = execFileSync("node", ["tools/expand_imports.js", file], {
        cwd: ROOT,
        encoding: "utf8"
      });

      const tick = Date.now() - START_TIME;
      const withTick = injectTick(expanded, tick);

      fs.writeFileSync(expandedPath, withTick);

      const output = execFileSync("node", ["tools/run_js_vm.js", expandedPath], {
        cwd: ROOT,
        encoding: "utf8"
      });

      send(res, 200, "application/json", output.trim());
    } catch (err) {
      console.error(err);
      send(res, 500, "application/json", JSON.stringify({
        error: "Internal server error"
      }));
    }

    return;
  }

  const filePath = url.pathname === "/"
    ? path.join(ROOT, "simla3d_viewer.html")
    : safePath(url.pathname);

  if (!filePath || !fs.existsSync(filePath)) {
    send(res, 404, "text/plain", "Not found");
    return;
  }

  const ext = path.extname(filePath);
  const type =
    ext === ".html" ? "text/html" :
    ext === ".js" ? "application/javascript" :
    ext === ".css" ? "text/css" :
    "text/plain";

  send(res, 200, type, fs.readFileSync(filePath));
});

server.listen(PORT, () => {
  console.log(`Simla3D viewer running: http://localhost:${PORT}`);
  console.log(`Scene API: http://localhost:${PORT}/api/scene?file=examples/simla3d_demo.sim`);
});
