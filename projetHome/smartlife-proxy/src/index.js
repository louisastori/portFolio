require("dotenv").config();

const cors = require("cors");
const express = require("express");
const helmet = require("helmet");

const { config, validateConfig } = require("./config");
const { TuyaClient } = require("./tuyaClient");
const { LightService } = require("./lightService");

const authMiddleware = (req, res, next) => {
  if (req.path === "/health") {
    return next();
  }

  const authHeader = req.header("authorization") || "";
  const [, token] = authHeader.split(" ");

  if (!token || token !== config.proxyToken) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid Bearer token.",
    });
  }

  return next();
};

const ensureDeviceAllowed = (req, res, next) => {
  const deviceId = req.params.id;
  if (!config.tuya.deviceIds.includes(deviceId)) {
    return res.status(404).json({
      error: "NotFound",
      message: "Device id is not in TUYA_DEVICE_IDS allow-list.",
    });
  }
  return next();
};

const asyncRoute = (handler) => async (req, res, next) => {
  try {
    await handler(req, res);
  } catch (error) {
    next(error);
  }
};

const run = async () => {
  validateConfig();

  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "100kb" }));
  app.use(authMiddleware);

  const tuyaClient = new TuyaClient({
    apiHost: config.tuya.apiHost,
    clientId: config.tuya.clientId,
    clientSecret: config.tuya.clientSecret,
    requestTimeoutMs: config.tuya.requestTimeoutMs,
  });
  const lightService = new LightService(tuyaClient, config);

  app.get(
    "/health",
    asyncRoute(async (_req, res) => {
      res.json({
        status: "ok",
        service: "smartlife-proxy",
        region: config.tuya.region,
        deviceCount: config.tuya.deviceIds.length,
        now: new Date().toISOString(),
      });
    })
  );

  app.get(
    "/lights",
    asyncRoute(async (req, res) => {
      const force = req.query && String(req.query.live || "") === "1";
      const snapshot = await lightService.listLights({ forceRefresh: force });
      res.json({
        count: snapshot.lights.length,
        lights: snapshot.lights,
        warnings: snapshot.warnings,
        generatedAt: new Date(snapshot.updatedAt || Date.now()).toISOString(),
      });
    })
  );

  app.post(
    "/lights/:id/toggle",
    ensureDeviceAllowed,
    asyncRoute(async (req, res) => {
      const body = req.body || {};
      if (typeof body.on !== "boolean") {
        return res.status(422).json({
          error: "ValidationError",
          message: "`on` must be a boolean.",
        });
      }

      await lightService.toggleLight(req.params.id, body.on);
      res.json({
        ok: true,
        id: req.params.id,
        on: body.on,
      });
    })
  );

  app.post(
    "/lights/:id/brightness",
    ensureDeviceAllowed,
    asyncRoute(async (req, res) => {
      const body = req.body || {};
      const brightness = Number(body.brightness);

      if (!Number.isFinite(brightness) || brightness < 0 || brightness > 100) {
        return res.status(422).json({
          error: "ValidationError",
          message: "`brightness` must be a number in range 0..100.",
        });
      }

      await lightService.setBrightness(req.params.id, brightness);
      res.json({
        ok: true,
        id: req.params.id,
        brightness: Math.round(brightness),
      });
    })
  );

  app.use((error, _req, res, _next) => {
    const status = error && error.statusCode ? error.statusCode : 500;
    res.status(status).json({
      error: "ProxyError",
      message: error && error.message ? error.message : "Unexpected error.",
    });
  });

  app.listen(config.port, () => {
    console.log(
      `smartlife-proxy listening on http://localhost:${config.port} (region=${config.tuya.region})`
    );
  });
};

run().catch((error) => {
  console.error(`Failed to start smartlife-proxy: ${error.message}`);
  process.exit(1);
});
