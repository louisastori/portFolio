const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");

const { config } = require("./config");
const { contentTypeForPath, createError, readJsonBody, sendJson, sendText } = require("./http");
const { getDashboardSnapshot, invalidateDashboardCache } = require("./services/dashboard");
const { getAiLabStatus } = require("./services/aiLab");
const { setLightBrightness, setLightColor, toggleLightPower } = require("./services/lights");
const { chatWithOllama, getOllamaStatus } = require("./services/ollamaChat");
const { getSleepSunSnapshot } = require("./services/sleepSun");

const serveStatic = async (pathname, res) => {
  const targetPath = pathname === "/" ? "/index.html" : pathname;
  const relativePath = targetPath.replace(/^\/+/, "");
  const filePath = path.resolve(config.webDir, relativePath);

  if (!filePath.startsWith(path.resolve(config.webDir) + path.sep) && filePath !== path.resolve(config.webDir, "index.html")) {
    return false;
  }

  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return false;
    }
  } catch (_error) {
    return false;
  }

  const content = await fs.readFile(filePath);

  res.writeHead(200, {
    "Cache-Control": targetPath === "/index.html" ? "no-store" : "public, max-age=300",
    "Content-Type": contentTypeForPath(filePath),
    "Content-Length": content.byteLength,
  });
  res.end(content);
  return true;
};

const parseLightRoute = (pathname) => {
  const toggleMatch = pathname.match(/^\/api\/lights\/([^/]+)\/([^/]+)\/toggle$/);
  if (toggleMatch) {
    return {
      type: "toggle",
      provider: decodeURIComponent(toggleMatch[1]),
      id: decodeURIComponent(toggleMatch[2]),
    };
  }

  const brightnessMatch = pathname.match(/^\/api\/lights\/([^/]+)\/([^/]+)\/brightness$/);
  if (brightnessMatch) {
    return {
      type: "brightness",
      provider: decodeURIComponent(brightnessMatch[1]),
      id: decodeURIComponent(brightnessMatch[2]),
    };
  }

  const colorMatch = pathname.match(/^\/api\/lights\/([^/]+)\/([^/]+)\/color$/);
  if (colorMatch) {
    return {
      type: "color",
      provider: decodeURIComponent(colorMatch[1]),
      id: decodeURIComponent(colorMatch[2]),
    };
  }

  return null;
};

const requestListener = async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const { pathname, searchParams } = requestUrl;

  try {
    if (req.method === "GET" && pathname === "/api/health") {
      sendJson(res, 200, {
        status: "ok",
        service: "projethome-hub",
        now: new Date().toISOString(),
        refreshIntervalMs: config.app.refreshIntervalMs,
        cacheTtlMs: config.app.cacheTtlMs,
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/dashboard") {
      const forceLive = searchParams.get("live") === "1";
      const snapshot = await getDashboardSnapshot({ forceLive });
      sendJson(res, 200, snapshot);
      return;
    }

    if (req.method === "GET" && pathname === "/api/sleep-sun") {
      const snapshot = getSleepSunSnapshot(config, {
        date: searchParams.get("date"),
      });
      sendJson(res, 200, snapshot);
      return;
    }

    if (req.method === "GET" && pathname === "/api/ollama/status") {
      const status = await getOllamaStatus(config);
      sendJson(res, 200, status);
      return;
    }

    if (req.method === "GET" && pathname === "/api/ai-lab/status") {
      const status = await getAiLabStatus(config);
      sendJson(res, 200, status);
      return;
    }

    if (req.method === "POST" && pathname === "/api/ollama/chat") {
      const body = await readJsonBody(req);
      const result = await chatWithOllama(config, {
        messages: body.messages,
      });
      sendJson(res, 200, result);
      return;
    }

    const lightRoute = parseLightRoute(pathname);
    if (req.method === "POST" && lightRoute) {
      const body = await readJsonBody(req);

      if (lightRoute.type === "toggle") {
        if (typeof body.on !== "boolean") {
          throw createError(422, "`on` must be a boolean.");
        }

        await toggleLightPower(config, lightRoute.provider, lightRoute.id, body.on);
        invalidateDashboardCache();
        sendJson(res, 200, {
          ok: true,
          provider: lightRoute.provider,
          id: lightRoute.id,
          on: body.on,
        });
        return;
      }

      if (lightRoute.type === "color") {
        if (typeof body.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(body.color)) {
          throw createError(422, "`color` must be a hex color in format #rrggbb.");
        }

        await setLightColor(config, lightRoute.provider, lightRoute.id, body.color);
        invalidateDashboardCache();
        sendJson(res, 200, {
          ok: true,
          provider: lightRoute.provider,
          id: lightRoute.id,
          color: body.color.toLowerCase(),
        });
        return;
      }

      const brightness = Number(body.brightness);
      if (!Number.isFinite(brightness) || brightness < 0 || brightness > 100) {
        throw createError(422, "`brightness` must be a number in range 0..100.");
      }

      await setLightBrightness(config, lightRoute.provider, lightRoute.id, brightness);
      invalidateDashboardCache();
      sendJson(res, 200, {
        ok: true,
        provider: lightRoute.provider,
        id: lightRoute.id,
        brightness: Math.round(brightness),
      });
      return;
    }

    if (req.method === "GET" && !pathname.startsWith("/api/")) {
      const served = await serveStatic(pathname, res);
      if (served) {
        return;
      }
    }

    sendJson(res, 404, {
      error: "NotFound",
      message: "Route not found.",
    });
  } catch (error) {
    const statusCode = error && error.statusCode ? error.statusCode : 500;
    const message = error && error.message ? error.message : "Unexpected error.";

    if (pathname.startsWith("/api/")) {
      sendJson(res, statusCode, {
        error: "HubError",
        message,
      });
      return;
    }

    sendText(res, statusCode, message);
  }
};

const server = http.createServer(requestListener);

server.listen(config.port, () => {
  console.log(`projetHome hub listening on http://0.0.0.0:${config.port}`);
});
