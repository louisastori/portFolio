const DEFAULT_TIMEOUT_MS = 15_000;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const fetchJson = async (url, init = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init.headers || {}),
      },
    });

    const rawBody = await response.text();
    if (!response.ok) {
      throw createError(response.status, `HTTP ${response.status} - ${rawBody.slice(0, 180) || response.statusText}`);
    }

    if (!rawBody) {
      return undefined;
    }

    return JSON.parse(rawBody);
  } catch (error) {
    if (error && error.name === "AbortError") {
      throw createError(504, `Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const readJsonBody = async (req) => {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (_error) {
    throw createError(400, "Invalid JSON body.");
  }
};

const sendJson = (res, statusCode, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
};

const sendText = (res, statusCode, body, contentType = "text/plain; charset=utf-8") => {
  res.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
};

const contentTypeForPath = (filePath) => {
  const extension = filePath.slice(filePath.lastIndexOf("."));
  return MIME_TYPES[extension] || "application/octet-stream";
};

module.exports = {
  contentTypeForPath,
  createError,
  fetchJson,
  readJsonBody,
  sendJson,
  sendText,
};
