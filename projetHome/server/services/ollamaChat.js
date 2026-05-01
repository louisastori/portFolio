const { createError } = require("../http");
const { getSportSummary } = require("./garminSummary");

const PREFERRED_OLLAMA_MODELS = ["gemma3:4b", "phi3:mini", "llama3.2:3b"];
const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 2_000;
const MODEL_CACHE_TTL_MS = 60_000;
const CHAT_SYSTEM_PROMPT = [
  "Tu es Ollama integre au dashboard personnel de Louis.",
  "Tu reponds en francais, de facon naturelle, claire et concise.",
  "Quand la question concerne le sport, le sommeil, la recuperation ou la charge, appuie-toi d abord sur le contexte Garmin fourni.",
  "Quand l information n existe pas dans le contexte, dis-le clairement sans inventer.",
  "Pour les questions generales, tu peux repondre normalement mais reste utile et compact.",
].join(" ");

let modelCache = {
  baseUrl: "",
  expiresAt: 0,
  availableModels: [],
};

const withTimeout = async (callback, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await callback(controller.signal);
  } catch (error) {
    if (error && error.name === "AbortError") {
      throw createError(504, `Ollama timeout after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const fetchOllamaJson = async ({ baseUrl, path, timeoutMs }) => {
  return withTimeout(
    async (signal) => {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "GET",
        signal,
      });

      const rawBody = await response.text();
      if (!response.ok) {
        throw createError(response.status, `Ollama ${path} HTTP ${response.status}: ${rawBody.slice(0, 220)}`);
      }

      if (!rawBody) {
        return {};
      }

      try {
        return JSON.parse(rawBody);
      } catch (_error) {
        throw createError(502, `Ollama ${path} returned invalid JSON.`);
      }
    },
    timeoutMs
  );
};

const fetchAvailableModels = async (baseUrl, timeoutMs) => {
  if (
    modelCache.baseUrl === baseUrl &&
    modelCache.expiresAt > Date.now() &&
    Array.isArray(modelCache.availableModels) &&
    modelCache.availableModels.length
  ) {
    return modelCache.availableModels.slice();
  }

  const payload = await fetchOllamaJson({
    baseUrl,
    path: "/api/tags",
    timeoutMs,
  });

  const availableModels = Array.isArray(payload && payload.models)
    ? payload.models
        .map((model) => String((model && model.name) || "").trim())
        .filter(Boolean)
    : [];

  modelCache = {
    baseUrl,
    expiresAt: Date.now() + MODEL_CACHE_TTL_MS,
    availableModels,
  };

  return availableModels.slice();
};

const getOllamaStatus = async (config) => {
  const baseUrl = config && config.ollama && config.ollama.baseUrl;
  const requestedModel = config && config.ollama ? config.ollama.model : "";
  const timeoutMs = (config && config.ollama && config.ollama.timeoutMs) || 45_000;

  if (!baseUrl) {
    return {
      ok: false,
      available: false,
      baseUrl: "",
      configuredModel: requestedModel || null,
      model: null,
      autoSelected: false,
      version: null,
      availableModels: [],
      availableModelCount: 0,
      loadedModels: [],
      loadedModelCount: 0,
      message: "OLLAMA_BASE_URL is missing.",
    };
  }

  try {
    const [versionPayload, psPayload, modelState] = await Promise.all([
      fetchOllamaJson({
        baseUrl,
        path: "/api/version",
        timeoutMs,
      }),
      fetchOllamaJson({
        baseUrl,
        path: "/api/ps",
        timeoutMs,
      }),
      resolveModel({
        baseUrl,
        requestedModel,
        timeoutMs,
      }),
    ]);

    const loadedModels = Array.isArray(psPayload && psPayload.models)
      ? psPayload.models
          .map((model) => ({
            name: String((model && model.name) || "").trim(),
            expiresAt: model && model.expires_at ? model.expires_at : null,
            contextLength: Number(model && model.context_length) || 0,
          }))
          .filter((model) => model.name)
      : [];

    return {
      ok: true,
      available: true,
      baseUrl,
      configuredModel: requestedModel || null,
      model: modelState.model,
      autoSelected: modelState.autoSelected,
      version: versionPayload && versionPayload.version ? String(versionPayload.version) : null,
      availableModels: modelState.availableModels,
      availableModelCount: modelState.availableModels.length,
      loadedModels,
      loadedModelCount: loadedModels.length,
      message: "",
    };
  } catch (error) {
    return {
      ok: false,
      available: false,
      baseUrl,
      configuredModel: requestedModel || null,
      model: null,
      autoSelected: false,
      version: null,
      availableModels: [],
      availableModelCount: 0,
      loadedModels: [],
      loadedModelCount: 0,
      message: error && error.message ? error.message : "Ollama unavailable.",
    };
  }
};

const resolveModel = async ({ baseUrl, requestedModel, timeoutMs }) => {
  const availableModels = await fetchAvailableModels(baseUrl, timeoutMs);

  if (!availableModels.length) {
    if (requestedModel) {
      return {
        model: requestedModel,
        autoSelected: false,
        availableModels,
      };
    }

    throw createError(503, "No Ollama models are available locally.");
  }

  if (requestedModel) {
    const exactMatch = availableModels.find((model) => model === requestedModel);
    if (exactMatch) {
      return {
        model: exactMatch,
        autoSelected: false,
        availableModels,
      };
    }

    const caseInsensitiveMatch = availableModels.find(
      (model) => model.toLowerCase() === requestedModel.toLowerCase()
    );
    if (caseInsensitiveMatch) {
      return {
        model: caseInsensitiveMatch,
        autoSelected: false,
        availableModels,
      };
    }
  }

  return {
    model: PREFERRED_OLLAMA_MODELS.find((model) => availableModels.includes(model)) || availableModels[0],
    autoSelected: true,
    availableModels,
  };
};

const normalizeMessage = (message) => {
  if (!message || typeof message !== "object") {
    return null;
  }

  const role = message.role === "assistant" ? "assistant" : message.role === "user" ? "user" : null;
  const content = String(message.content || "").trim().slice(0, MAX_MESSAGE_LENGTH);

  if (!role || !content) {
    return null;
  }

  return {
    role,
    content,
  };
};

const normalizeConversation = (messages) => {
  if (!Array.isArray(messages)) {
    throw createError(422, "`messages` must be an array.");
  }

  const conversation = messages.map(normalizeMessage).filter(Boolean).slice(-MAX_HISTORY_MESSAGES);
  if (!conversation.some((message) => message.role === "user")) {
    throw createError(422, "At least one user message is required.");
  }

  return conversation;
};

const numberOrDash = (value, digits = 1) => {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  const rounded = Number(value.toFixed(digits));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(digits);
};

const describeActivity = (activity) => {
  const parts = [
    activity.dateLocal || activity.date || "date n/a",
    activity.name || "Activite",
    activity.typeKey || "type n/a",
    `${numberOrDash(activity.distanceKm)} km`,
    `${numberOrDash(activity.durationMin, 0)} min`,
    `charge ${numberOrDash(activity.trainingLoad, 0)}`,
  ];

  if (Number.isFinite(activity.averageHr)) {
    parts.push(`fc ${numberOrDash(activity.averageHr, 0)}`);
  }

  if (Number.isFinite(activity.paceSecPerKm) && activity.paceSecPerKm > 0) {
    const total = Math.round(activity.paceSecPerKm);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    parts.push(`allure ${minutes}:${String(seconds).padStart(2, "0")}/km`);
  }

  if (Number.isFinite(activity.averageSpeedKmh) && activity.averageSpeedKmh > 0) {
    parts.push(`vitesse ${numberOrDash(activity.averageSpeedKmh)} km/h`);
  }

  return parts.join(", ");
};

const buildSportContext = (sport) => {
  if (!sport) {
    return "";
  }

  const lines = [];
  const analytics = sport.analytics || {};
  const ai = sport.aiAnalysis || {};
  const coachSignals = ai.coachSignals || {};
  const latestActivities = Array.isArray(sport.recentActivities) ? sport.recentActivities.slice(0, 5) : [];
  const latestNights = Array.isArray(sport.sleep && sport.sleep.recentNights) ? sport.sleep.recentNights.slice(-3) : [];

  lines.push("Contexte sportif actuel");
  lines.push(
    `Vue globale: ${numberOrDash(sport.overview?.totalActivities, 0)} activites, ${numberOrDash(
      sport.overview?.totalDistanceKm
    )} km, ${numberOrDash(sport.overview?.totalDurationHours)} h, charge totale ${numberOrDash(
      sport.overview?.totalTrainingLoad,
      0
    )}.`
  );
  lines.push(
    `7 jours: ${numberOrDash(sport.recent7?.activityCount, 0)} seances, ${numberOrDash(
      sport.recent7?.distanceKm
    )} km, ${numberOrDash(sport.recent7?.durationHours)} h, charge ${numberOrDash(
      sport.recent7?.trainingLoad,
      0
    )}.`
  );
  lines.push(
    `28 jours: ${numberOrDash(sport.recent28?.activityCount, 0)} seances, ${numberOrDash(
      sport.recent28?.distanceKm
    )} km, ${numberOrDash(sport.recent28?.durationHours)} h, charge ${numberOrDash(
      sport.recent28?.trainingLoad,
      0
    )}.`
  );
  lines.push(
    `Recuperation: body battery reveil ${numberOrDash(sport.recovery?.wakeBodyBatteryAvg, 0)}, stress ${numberOrDash(
      sport.recovery?.stressAvg,
      0
    )}, fc repos ${numberOrDash(sport.recovery?.restingHeartRateAvg, 0)}, sommeil moyen ${numberOrDash(
      sport.recovery?.sleepHoursAvg
    )} h.`
  );
  lines.push(
    `Sommeil: score moyen ${numberOrDash(sport.sleep?.scoreAvg, 0)}, HRV ${numberOrDash(
      sport.sleep?.hrvAvg,
      0
    )}, besoin moyen ${numberOrDash((sport.sleep?.sleepNeedAvgMinutes || 0) / 60)} h, dette recente ${numberOrDash(
      analytics.sleepDebtHours
    )} h.`
  );
  lines.push(
    `Charge et tendance: ratio charge 7j/28j ${numberOrDash(analytics.loadRatio7to28, 2)}x, VO2max ${numberOrDash(
      sport.performance?.vo2Max,
      0
    )}, part outdoor ${numberOrDash(sport.overview?.outdoorShare, 0)}%.`
  );

  if (coachSignals.alert || coachSignals.advice || coachSignals.tomorrowWorkout) {
    lines.push(
      `Signaux coach: alerte ${coachSignals.alert || "n/a"} conseil ${coachSignals.advice || "n/a"} demain ${
        coachSignals.tomorrowWorkout || "n/a"
      } risque fatigue ${coachSignals.fatigueRisk || "n/a"} focus ${coachSignals.focus || "n/a"}.`
    );
  }

  latestNights.forEach((night) => {
    lines.push(
      `Nuit ${night.date}: score ${numberOrDash(night.score, 0)}, duree ${numberOrDash(
        night.durationHours
      )} h, profond ${numberOrDash(night.deepHours)} h, REM ${numberOrDash(night.remHours)} h, stress ${numberOrDash(
        night.avgSleepStress,
        0
      )}.`
    );
  });

  latestActivities.forEach((activity) => {
    lines.push(`Activite recente: ${describeActivity(activity)}.`);
  });

  return lines.join("\n");
};

const callOllamaChat = async ({ baseUrl, model, messages, timeoutMs }) => {
  const payload = await withTimeout(
    async (signal) => {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal,
        body: JSON.stringify({
          model,
          stream: false,
          keep_alive: "30m",
          messages,
          options: {
            temperature: 0.35,
            num_predict: 500,
          },
        }),
      });

      const rawBody = await response.text();
      if (!response.ok) {
        throw createError(response.status, `Ollama HTTP ${response.status}: ${rawBody.slice(0, 260)}`);
      }

      try {
        return JSON.parse(rawBody);
      } catch (_error) {
        throw createError(502, "Ollama returned invalid JSON.");
      }
    },
    timeoutMs
  );

  const content = String(
    (payload && payload.message && payload.message.content) || payload.response || ""
  ).trim();

  if (!content) {
    throw createError(502, "Ollama returned an empty response.");
  }

  return {
    payload,
    content,
  };
};

const chatWithOllama = async (config, { messages }) => {
  const conversation = normalizeConversation(messages);
  const baseUrl = config && config.ollama && config.ollama.baseUrl;
  const requestedModel = config && config.ollama ? config.ollama.model : "";
  const timeoutMs = (config && config.ollama && config.ollama.timeoutMs) || 45_000;

  if (!baseUrl) {
    throw createError(500, "OLLAMA_BASE_URL is missing.");
  }

  let sportContext = "";
  try {
    sportContext = buildSportContext(getSportSummary(config));
  } catch (_error) {
    sportContext = "";
  }

  const modelState = await resolveModel({
    baseUrl,
    requestedModel,
    timeoutMs,
  });

  const messagesForOllama = [{ role: "system", content: CHAT_SYSTEM_PROMPT }];
  if (sportContext) {
    messagesForOllama.push({
      role: "system",
      content: sportContext,
    });
  }
  messagesForOllama.push(...conversation);

  const responseState = await callOllamaChat({
    baseUrl,
    model: modelState.model,
    messages: messagesForOllama,
    timeoutMs,
  });

  return {
    ok: true,
    model: modelState.model,
    autoSelected: modelState.autoSelected,
    generatedAt: new Date().toISOString(),
    contextLoaded: Boolean(sportContext),
    message: {
      role: "assistant",
      content: responseState.content,
    },
  };
};

module.exports = {
  chatWithOllama,
  getOllamaStatus,
};
