const crypto = require("crypto");
const { hmacSha256Upper, sha256Hex } = require("./utils");

class TuyaClient {
  constructor({ apiHost, clientId, clientSecret, requestTimeoutMs }) {
    this.apiHost = apiHost.replace(/\/$/, "");
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.requestTimeoutMs = requestTimeoutMs || 10000;
    this.token = null;
    this.tokenExpiresAt = 0;
  }

  async getAccessToken() {
    if (this.token && Date.now() < this.tokenExpiresAt - 5000) {
      return this.token;
    }

    const result = await this.request("GET", "/v1.0/token", {
      query: { grant_type: 1 },
      withToken: false,
    });

    const token = result?.access_token;
    const expiresIn = Number(result?.expire_time || 0);
    if (!token || !expiresIn) {
      throw new Error("Tuya token response is invalid.");
    }

    this.token = token;
    this.tokenExpiresAt = Date.now() + expiresIn * 1000;
    return token;
  }

  async request(method, path, options = {}) {
    const query = options.query || {};
    const body = options.body === undefined ? undefined : options.body;
    const withToken = options.withToken !== false;

    const accessToken = withToken ? await this.getAccessToken() : "";
    const now = String(Date.now());
    const nonce = crypto.randomUUID();

    const queryString = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }
      queryString.set(key, String(value));
    }

    const endpointPath = queryString.size ? `${path}?${queryString}` : path;
    const bodyString = body === undefined ? "" : JSON.stringify(body);
    const contentSha = sha256Hex(bodyString);
    const stringToSign = `${method}\n${contentSha}\n\n${endpointPath}`;
    const signPayload = `${this.clientId}${accessToken}${now}${nonce}${stringToSign}`;
    const sign = hmacSha256Upper(this.clientSecret, signPayload);

    const headers = {
      client_id: this.clientId,
      sign,
      t: now,
      sign_method: "HMAC-SHA256",
      nonce,
    };

    if (withToken) {
      headers.access_token = accessToken;
    }
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const url = `${this.apiHost}${endpointPath}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: bodyString || undefined,
        signal: controller.signal,
      });

      const raw = await response.text();
      const payload = raw ? JSON.parse(raw) : {};
      if (!response.ok) {
        throw new Error(`Tuya HTTP ${response.status}: ${raw.slice(0, 200)}`);
      }

      if (payload.success === false) {
        const msg = payload.msg || payload.message || "Unknown Tuya API error.";
        const code = payload.code ? ` (${payload.code})` : "";
        throw new Error(`Tuya API error${code}: ${msg}`);
      }

      return payload.result;
    } finally {
      clearTimeout(timer);
    }
  }

  async getDeviceDetails(deviceId) {
    return this.request("GET", `/v1.0/devices/${deviceId}`);
  }

  async getDeviceStatus(deviceId) {
    return this.request("GET", `/v1.0/devices/${deviceId}/status`);
  }

  async getDeviceFunctions(deviceId) {
    return this.request("GET", `/v1.0/devices/${deviceId}/functions`);
  }

  async sendCommands(deviceId, commands) {
    return this.request("POST", `/v1.0/devices/${deviceId}/commands`, {
      body: { commands },
    });
  }
}

module.exports = {
  TuyaClient,
};
