// Vice Diagonal — tiny static server for local preview and screenshots.
// Serves the app/ directory on localhost. No dependencies, no network
// access beyond the local socket.
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, normalize } from "node:path";
import { createServer } from "node:http";

const root = join(new URL(".", import.meta.url).pathname, "app");
const port = Number(process.argv[2] || process.env.PORT || 8901);

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const server = createServer((req, res) => {
  const raw = decodeURIComponent((req.url || "/").split("?")[0]);
  const safe = normalize(join(root, raw === "/" ? "index.html" : raw));
  if (!safe.startsWith(root) || !existsSync(safe) || !statSync(safe).isFile()) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(safe)] || "application/octet-stream" });
  res.end(readFileSync(safe));
});

server.listen(port, "127.0.0.1", () => {
  console.log("Vice Diagonal serving http://127.0.0.1:" + port + "/");
});
