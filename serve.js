import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { execFileSync, spawn } from "child_process";
import { parseRWX } from "./tools/parse_rwx.js";

const port = 8080;
const ROOT = process.cwd();
const START_TIME = Date.now();
const DEFAULT_AW_BRIDGE_TIMEOUT_MS = 8000;
const AW_BRIDGE_TIMEOUT_MS_BY_CMD = {
  health: 4000,
  state: 4000,
  world_info: 4000,
  world_attrs_scan: 8000,
  object_path_set: 8000,
  connect: 15000,
  move: 4000,
  teleport: 4000,
  query: 20000,
  object_query: 8000,
  object_add: 30000,
  object_delete: 30000,
  disconnect: 4000,
};

let awBridgeProc = null;
let awBridgeSeq = 1;
let awBridgeBuffer = "";
const awBridgePending = new Map();

function respondJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) reject(new Error("Body too large"));
    });
    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function rejectPendingAwBridge(err) {
  for (const [, item] of awBridgePending) {
    clearTimeout(item.timeout);
    item.reject(err);
  }
  awBridgePending.clear();
}

function ensureAwBridge() {
  if (awBridgeProc && !awBridgeProc.killed) return awBridgeProc;

  awBridgeProc = spawn("python", ["tools/aw_bridge.py"], {
    cwd: ROOT,
    stdio: ["pipe", "pipe", "pipe"],
  });

  awBridgeProc.stdout.on("data", chunk => {
    awBridgeBuffer += chunk.toString();
    let idx = awBridgeBuffer.indexOf("\n");
    while (idx !== -1) {
      const line = awBridgeBuffer.slice(0, idx).trim();
      awBridgeBuffer = awBridgeBuffer.slice(idx + 1);
      if (line) {
        try {
          const msg = JSON.parse(line);
          const pending = awBridgePending.get(msg.id);
          if (pending) {
            awBridgePending.delete(msg.id);
            clearTimeout(pending.timeout);
            if (msg.ok) pending.resolve(msg.data);
            else pending.reject(new Error(msg.error || "AW bridge command failed"));
          }
        } catch (err) {
          console.error("AW bridge parse error:", err.message);
        }
      }
      idx = awBridgeBuffer.indexOf("\n");
    }
  });

  awBridgeProc.stderr.on("data", chunk => {
    console.error("AW bridge:", chunk.toString().trim());
  });

  awBridgeProc.on("exit", (code, signal) => {
    rejectPendingAwBridge(new Error(`AW bridge exited code=${code} signal=${signal}`));
    awBridgeProc = null;
    awBridgeBuffer = "";
  });

  awBridgeProc.on("error", err => {
    rejectPendingAwBridge(err);
    awBridgeProc = null;
    awBridgeBuffer = "";
  });

  return awBridgeProc;
}

function getAwBridgeTimeoutMs(cmd) {
  return AW_BRIDGE_TIMEOUT_MS_BY_CMD[cmd] || DEFAULT_AW_BRIDGE_TIMEOUT_MS;
}

function callAwBridge(cmd, args = {}) {
  return new Promise((resolve, reject) => {
    const proc = ensureAwBridge();
    const id = awBridgeSeq++;
    const safeTimeoutMs = getAwBridgeTimeoutMs(cmd);
    const timeout = setTimeout(() => {
      awBridgePending.delete(id);
      reject(new Error(`AW bridge timeout for ${cmd}`));
    }, safeTimeoutMs);

    awBridgePending.set(id, { resolve, reject, timeout });
    proc.stdin.write(JSON.stringify({ id, cmd, args }) + "\n");
  });
}

function injectTick(src, tick) {
  const trimmed = src.trim();
  if (trimmed.startsWith("(begin")) {
    return trimmed.replace("(begin", `(begin\n  (let tick ${tick})`);
  }
  return `(begin\n  (let tick ${tick})\n  ${src}\n)`;
}

const modelCache = new Map(); // name -> parsed RWX JSON string

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, res => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = "";
      res.setEncoding("latin1");
      res.on("data", c => data += c);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function resolveWorkspacePath(file) {
  const abs = path.resolve(ROOT, file);
  const rel = path.relative(ROOT, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return null;
  }
  return abs;
}

async function getAwObjectPath() {
  const data = await callAwBridge("world_info", { waitMs: 150 });
  let objectPath = String(data.objectPath || "").trim();
  if (!data.connected) {
    throw new Error("AW is not connected");
  }
  if (!objectPath) {
    throw new Error("World did not provide AW_WORLD_OBJECT_PATH");
  }
  if (!/^https?:\/\//i.test(objectPath)) {
    objectPath = `https://${objectPath}`;
  }
  return objectPath.endsWith("/") ? objectPath : objectPath + "/";
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);

  if (url.pathname.startsWith("/api/aw/")) {
    try {
      if (url.pathname === "/api/aw/health") {
        const data = await callAwBridge("health", {});
        respondJson(res, 200, data);
        return;
      }

      if (url.pathname === "/api/aw/state") {
        const data = await callAwBridge("state", { waitMs: 10 });
        respondJson(res, 200, data);
        return;
      }

      if (url.pathname === "/api/aw/world-info") {
        const data = await callAwBridge("world_info", { waitMs: 150 });
        respondJson(res, 200, data);
        return;
      }

      if (url.pathname === "/api/aw/world-attrs") {
        const qs = url.searchParams;
        const data = await callAwBridge("world_attrs_scan", {
          start: parseInt(qs.get("start") || "40"),
          end: parseInt(qs.get("end") || "300"),
        });
        respondJson(res, 200, data);
        return;
      }

      if (url.pathname === "/api/aw/object-path" && req.method === "POST") {
        const body = await parseBody(req);
        const data = await callAwBridge("object_path_set", body);
        modelCache.clear();
        respondJson(res, 200, data);
        return;
      }

      if (url.pathname === "/api/aw/connect" && req.method === "POST") {
        const body = await parseBody(req);
        const data = await callAwBridge("connect", body);
        respondJson(res, 200, data);
        return;
      }

      if (url.pathname === "/api/aw/move" && req.method === "POST") {
        const body = await parseBody(req);
        const data = await callAwBridge("move", body);
        respondJson(res, 200, data);
        return;
      }

      if (url.pathname === "/api/aw/teleport" && req.method === "POST") {
        const body = await parseBody(req);
        const data = await callAwBridge("teleport", body);
        respondJson(res, 200, data);
        return;
      }

      if (url.pathname === "/api/aw/query" && req.method === "POST") {
        const body = await parseBody(req);
        const data = await callAwBridge("query", body);
        respondJson(res, 200, data);
        return;
      }

      if (url.pathname === "/api/aw/object-query" && req.method === "POST") {
        const body = await parseBody(req);
        const data = await callAwBridge("object_query", body);
        respondJson(res, 200, data);
        return;
      }

      if (url.pathname === "/api/aw/object-add" && req.method === "POST") {
        const body = await parseBody(req);
        const data = await callAwBridge("object_add", body);
        respondJson(res, 200, data);
        return;
      }

      if (url.pathname === "/api/aw/object-delete" && req.method === "POST") {
        const body = await parseBody(req);
        const data = await callAwBridge("object_delete", body);
        respondJson(res, 200, data);
        return;
      }

      if (url.pathname === "/api/aw/disconnect" && req.method === "POST") {
        const data = await callAwBridge("disconnect", {});
        respondJson(res, 200, data);
        return;
      }

      if (url.pathname === "/api/aw/model" && req.method === "GET") {
        const name = url.searchParams.get("name");
        if (!name || name.includes("..") || name.includes("/")) {
          respondJson(res, 400, { error: "invalid model name" });
          return;
        }
        if (modelCache.has(name)) {
          res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" });
          res.end(modelCache.get(name));
          return;
        }
        let src = null;

        // Prefer local workspace RWX first so browser scene translation works
        // even when AW serves only zipped models remotely.
        const localCandidates = [
          path.join(ROOT, "aw", name),
          path.join(ROOT, name),
        ];
        for (const candidate of localCandidates) {
          if (fs.existsSync(candidate)) {
            src = fs.readFileSync(candidate, "utf8");
            break;
          }
        }

        if (src == null) {
          const objectPath = await getAwObjectPath();
          src = await fetchText(objectPath + encodeURIComponent(name));
        }

        const objects = parseRWX(src);
        const json = JSON.stringify(objects);
        modelCache.set(name, json);
        res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" });
        res.end(json);
        return;
      }

      respondJson(res, 405, { error: "Unsupported AW route or method" });
    } catch (err) {
      console.error(err);
      respondJson(res, 500, { error: "Internal server error" });
    }
    return;
  }

  if (url.pathname === "/api/rwx") {
    try {
      const file = url.searchParams.get("file");
      if (!file) { res.writeHead(400); res.end(JSON.stringify({ error: "missing ?file=" })); return; }
      if (/^https?:\/\//i.test(file)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "remote URLs are not allowed" }));
        return;
      }
      const abs = resolveWorkspacePath(file);
      if (!abs) { res.writeHead(403, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "forbidden" })); return; }
      const src = fs.readFileSync(abs, "utf8");
      const objects = parseRWX(src);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(objects));
    } catch (err) {
      console.error(err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
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
      console.error(err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
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

process.on("exit", () => {
  if (awBridgeProc && !awBridgeProc.killed) awBridgeProc.kill();
});

server.listen(port, () => {
  console.log("Server running at http://localhost:" + port);
});
