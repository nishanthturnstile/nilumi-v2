import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { extname, resolve, sep } from "node:path";

const directory = resolve(process.env.NILUMI_WEB_DIRECTORY ?? "/app/public");
const upstream = process.env.NILUMI_API_UPSTREAM;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};
const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store");
    if (!upstream) {
      res.writeHead(503).end();
      return;
    }
    const target = new URL(`${url.pathname}${url.search}`, upstream);
    const proxy = (target.protocol === "https:" ? httpsRequest : httpRequest)(
      target,
      {
        method: req.method,
        headers: { ...req.headers, host: target.host },
        timeout: 5000,
      },
      (response) => {
        res.writeHead(response.statusCode, { ...response.headers, "cache-control": "no-store" });
        response.pipe(res);
      },
    );
    proxy.on("timeout", () => proxy.destroy());
    proxy.on("error", () => {
      if (!res.headersSent) res.writeHead(502);
      res.end();
    });
    req.pipe(proxy);
    return;
  }
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405).end();
    return;
  }
  let path;
  try {
    path = resolve(directory, `.${decodeURIComponent(url.pathname)}`);
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (path !== directory && !path.startsWith(`${directory}${sep}`)) {
    res.writeHead(404).end();
    return;
  }
  if (existsSync(path) && statSync(path).isDirectory()) path = resolve(path, "index.html");
  if (!existsSync(path) && !extname(path) && existsSync(`${path}.html`)) path += ".html";
  if (!existsSync(path) || !statSync(path).isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, {
    "content-type": types[extname(path)] ?? "application/octet-stream",
    "cache-control": "no-cache",
    "x-content-type-options": "nosniff",
  });
  if (req.method === "HEAD") res.end();
  else createReadStream(path).pipe(res);
});
server.listen(Number(process.env.PORT ?? 8082), "0.0.0.0");
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), 5000);
    server.close(() => clearTimeout(deadline));
    server.closeIdleConnections();
  });
