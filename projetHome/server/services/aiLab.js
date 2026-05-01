const DEFAULT_TIMEOUT_MS = 3_500;

const buildServices = (config) => [
  {
    id: "ollama",
    title: "Ollama",
    description: "Assistant local deja branche dans projetHome.",
    baseUrl: config.ollama.baseUrl || "http://127.0.0.1:11434",
    probePath: "/api/version",
    launchPath: "/assistant.html",
    port: config.port,
  },
  {
    id: "h2o",
    title: "H2O Flow",
    description: "AutoML et tests tabulaires dans le navigateur.",
    baseUrl: config.aiLab.h2oBaseUrl || "http://127.0.0.1:54321",
    probePath: "/flow/index.html",
    launchPath: "/flow/index.html",
    port: 54321,
  },
];

const withTimeout = async (url, timeoutMs) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json, text/html;q=0.9, */*;q=0.8",
      },
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
};

const probeService = async (service, timeoutMs) => {
  const probeUrl = new URL(service.probePath || "/", `${service.baseUrl}/`).toString();

  try {
    const response = await withTimeout(probeUrl, timeoutMs);
    const available = response.status < 500;

    return {
      id: service.id,
      title: service.title,
      description: service.description,
      launchPath: service.launchPath || "/",
      port: service.port,
      available,
      message: available ? "service actif" : `HTTP ${response.status}`,
      statusCode: response.status,
      sticky: true,
    };
  } catch (error) {
    const isAbort = error && error.name === "AbortError";

    return {
      id: service.id,
      title: service.title,
      description: service.description,
      launchPath: service.launchPath || "/",
      port: service.port,
      available: false,
      message: isAbort ? "timeout" : error && error.message ? error.message : "indisponible",
      statusCode: null,
      sticky: true,
    };
  }
};

async function getAiLabStatus(config) {
  const timeoutMs =
    config && config.aiLab && Number.isFinite(config.aiLab.timeoutMs)
      ? Number(config.aiLab.timeoutMs)
      : DEFAULT_TIMEOUT_MS;
  const services = buildServices(config);
  const results = await Promise.all(services.map((service) => probeService(service, timeoutMs)));

  return {
    ok: true,
    services: results,
    availableCount: results.filter((service) => service.available).length,
    totalCount: results.length,
  };
}

module.exports = {
  getAiLabStatus,
};
