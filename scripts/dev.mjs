import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const directoryName = process.argv[2] || "src";
const port = Number(process.argv[3] || 4173);
const root = resolve(process.cwd(), directoryName);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  }).end(JSON.stringify(data));
}

async function serveBookPage(requestUrl, response) {
  const sourceUrl = requestUrl.searchParams.get("url") || "";
  let target;

  try {
    target = new URL(sourceUrl);
  } catch {
    sendJson(response, 400, { error: "올바른 도서 URL이 아닙니다." });
    return;
  }

  if (target.protocol !== "https:" || target.hostname !== "www.easyspub.co.kr") {
    sendJson(response, 400, { error: "이지스퍼블리싱 도서 URL만 등록할 수 있습니다." });
    return;
  }

  try {
    const requestHeaders = { "User-Agent": "easyspub-book-draw/1.0" };
    const firstResponse = await fetch(target, { headers: requestHeaders });
    const cookies = typeof firstResponse.headers.getSetCookie === "function"
      ? firstResponse.headers.getSetCookie()
      : [firstResponse.headers.get("set-cookie")].filter(Boolean);
    const sessionCookie = cookies.map((cookie) => cookie.split(";", 1)[0]).join("; ");
    const upstream = sessionCookie
      ? await fetch(target, { headers: { ...requestHeaders, Cookie: sessionCookie } })
      : firstResponse;
    if (!upstream.ok) throw new Error(`upstream responded with ${upstream.status}`);
    sendJson(response, 200, { html: await upstream.text() });
  } catch {
    sendJson(response, 502, { error: "도서 페이지를 불러오지 못했습니다." });
  }
}

createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", "http://localhost");
  const pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/api/book-page") {
    await serveBookPage(requestUrl, response);
    return;
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  let filePath = resolve(root, relativePath);

  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = resolve(filePath, "index.html");
  }

  if (!existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(filePath).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Book draw is running at http://localhost:${port}`);
});
