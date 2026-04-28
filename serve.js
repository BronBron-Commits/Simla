import http from "http";
import fs from "fs";
import path from "path";

const port = 8080;

const server = http.createServer((req, res) => {
  let filePath = "." + (req.url === "/" ? "/index.html" : req.url);

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
      res.writeHead(200, { "Content-Type": map[ext] || "text/plain" });
      res.end(content);
    }
  });
});

server.listen(port, () => {
  console.log("Server running at http://localhost:" + port);
});
