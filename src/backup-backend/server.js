const http = require("http");

const PORT = process.env.PORT || 8080;
const SERVICE_NAME = process.env.SERVICE_NAME || "K11 Backup Backend";
const APP_ROLE = process.env.APP_ROLE || "secondary-backend";

function jsonResponse(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });

  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      resolve(body);
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (
    req.method === "GET" &&
    (path === "/" || path === "/api/hello" || path === "/health")
  ) {
    return jsonResponse(res, 200, {
      success: true,
      service: SERVICE_NAME,
      role: APP_ROLE,
      status: "online",
      message: "Backup backend is running",
      generated_at: new Date().toISOString(),
    });
  }

  if (req.method === "GET" && path === "/api/fallback-status") {
    return jsonResponse(res, 200, {
      success: true,
      service: SERVICE_NAME,
      role: APP_ROLE,
      mode: "fallback",
      description:
        "This App Service acts as a secondary backend endpoint for Azure Traffic Manager failover.",
      available_routes: ["/api/hello", "/health", "/api/fallback-status"],
      generated_at: new Date().toISOString(),
    });
  }

  if (path.startsWith("/api/")) {
    await readBody(req);

    return jsonResponse(res, 503, {
      success: false,
      service: SERVICE_NAME,
      role: APP_ROLE,
      error: "Backup backend minimal belum menjalankan fitur API utama.",
      message:
        "Primary backend tetap Azure Functions. App Service ini digunakan sebagai endpoint cadangan/failover.",
      generated_at: new Date().toISOString(),
    });
  }

  return jsonResponse(res, 404, {
    success: false,
    error: "Route tidak ditemukan",
    path,
  });
});

server.listen(PORT, () => {
  console.log(`${SERVICE_NAME} listening on port ${PORT}`);
});
