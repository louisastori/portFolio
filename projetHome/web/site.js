const STORAGE_KEYS = {
  assistant: "projethome:assistant:v2",
  preferences: "projethome:preferences:v2",
};

const MAX_ASSISTANT_MESSAGES = 12;
const DEFAULT_ASSISTANT_GREETING =
  "Je peux commenter ta forme, ton sommeil, ta routine du soir et piloter tes lumieres locales.";

const QUICK_PROMPTS = [
  "Comment est ma forme aujourd hui ?",
  "Que me conseilles-tu ce soir pour mieux dormir ?",
  "Resume ma charge sportive sur 7 jours.",
  "Prepare la maison pour une soiree calme.",
];

const RSS_PAGE_CONFIG = {
  podcasts: {
    group: "podcasts",
    eyebrow: "Ecoute",
    empty: "Aucun episode RSS disponible pour le moment.",
  },
  dev: {
    group: "dev",
    eyebrow: "Lecture",
    empty: "Aucun article RSS disponible pour le moment.",
  },
};

const state = {
  page: document.body.dataset.page || "home",
  dashboard: null,
  sleepSun: null,
  aiLabStatus: null,
  ollamaStatus: null,
  rssDigests: {},
  rssErrors: {},
  rssLoading: {},
  fetchError: "",
  assistantMessages: loadAssistantMessages(),
  assistantSending: false,
  preferences: loadPreferences(),
  refreshTimer: null,
  clockTimer: null,
  overlayTimer: null,
};

const scenePresets = {
  calm: { label: "Soiree calme", on: true, brightness: 24, color: "#c36b35" },
  focus: { label: "Focus", on: true, brightness: 86, color: "#efe6d7" },
  night: { label: "Nuit douce", on: true, brightness: 6, color: "#ff7a2a" },
  blackout: { label: "Blackout", on: false, brightness: 0, color: "#ff7a2a" },
};

function loadPreferences() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.preferences) || "null");
    return {
      restModeActive: stored && typeof stored.restModeActive === "boolean" ? stored.restModeActive : true,
      silentMode: stored && typeof stored.silentMode === "boolean" ? stored.silentMode : true,
      readableMode: stored && typeof stored.readableMode === "boolean" ? stored.readableMode : false,
      autoSpeak: stored && typeof stored.autoSpeak === "boolean" ? stored.autoSpeak : false,
      whiteNoise: stored && typeof stored.whiteNoise === "boolean" ? stored.whiteNoise : true,
    };
  } catch (_error) {
    return {
      restModeActive: true,
      silentMode: true,
      readableMode: false,
      autoSpeak: false,
      whiteNoise: true,
    };
  }
}

function persistPreferences() {
  try {
    window.localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(state.preferences));
  } catch (_error) {
    // Ignore storage failures on locked-down devices.
  }
}

function loadAssistantMessages() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.assistant) || "[]");
    return sanitizeMessages(stored);
  } catch (_error) {
    return [];
  }
}

function persistAssistantMessages() {
  try {
    window.localStorage.setItem(STORAGE_KEYS.assistant, JSON.stringify(state.assistantMessages));
  } catch (_error) {
    // Ignore storage failures on locked-down devices.
  }
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .map((message) => {
      const role =
        message && message.role === "assistant"
          ? "assistant"
          : message && message.role === "user"
            ? "user"
            : "";
      const content = String(message && message.content ? message.content : "")
        .trim()
        .slice(0, 2400);

      if (!role || !content) {
        return null;
      }

      return { role, content };
    })
    .filter(Boolean)
    .slice(-MAX_ASSISTANT_MESSAGES);
}

function escapeHtml(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value || 0)));
}

function formatNumber(value, maximumFractionDigits = 1) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return Number.isInteger(value)
    ? value.toLocaleString("fr-FR")
    : value.toLocaleString("fr-FR", { maximumFractionDigits });
}

function formatDurationHours(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  if (value < 1) {
    return `${Math.round(value * 60)} min`;
  }

  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h`;
}

function formatDateTime(value) {
  if (!value) {
    return "n/a";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "n/a";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatRssDate(value) {
  if (!value) {
    return "date inconnue";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCalendarDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatDay(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(date);
}

function todayClockLabel() {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function todayDateLabel() {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function parseTimeLabel(label) {
  const match = String(label || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

function shiftTimeLabel(label, deltaMinutes) {
  const value = parseTimeLabel(label);
  if (!Number.isFinite(value)) {
    return label || "--:--";
  }

  const shifted = ((value + deltaMinutes) % (24 * 60) + 24 * 60) % (24 * 60);
  const hours = Math.floor(shifted / 60);
  const minutes = shifted % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function truncateText(value, maxLength) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  if (!text) {
    return "";
  }
  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...` : text;
}

function currentRssGroup() {
  const pageConfig = RSS_PAGE_CONFIG[state.page];
  return pageConfig ? pageConfig.group : "";
}

function apiGet(path) {
  return fetch(path, {
    headers: { Accept: "application/json" },
  }).then(async (response) => {
    const raw = await response.text();
    let parsed = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch (_error) {
        parsed = null;
      }
    }

    if (!response.ok) {
      const error = new Error(
        (parsed && (parsed.message || parsed.error)) || raw || `HTTP ${response.status}`
      );
      error.statusCode = response.status;
      error.payload = parsed;
      throw error;
    }
    return parsed;
  });
}

function apiPost(path, payload) {
  return fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  }).then(async (response) => {
    const raw = await response.text();
    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const data = raw ? JSON.parse(raw) : null;
        if (data && data.message) {
          message = data.message;
        }
      } catch (_error) {
        // Keep HTTP fallback.
      }
      throw new Error(message);
    }
    return raw ? JSON.parse(raw) : null;
  });
}

function getSport() {
  return state.dashboard && state.dashboard.sport ? state.dashboard.sport : null;
}

function getLights() {
  return state.dashboard && Array.isArray(state.dashboard.lights) ? state.dashboard.lights : [];
}

function normalizedLightName(light) {
  return String((light && light.name) || "").trim();
}

function normalizedLightKey(light) {
  return normalizedLightName(light).toLowerCase();
}

function isHiddenMaisonLight(light) {
  return normalizedLightKey(light) === "en bas";
}

function isLouisPairLight(light) {
  const key = normalizedLightKey(light);
  return key === "gauche louis" || key === "droite louis";
}

function parseLightIds(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getWarnings() {
  return state.dashboard && Array.isArray(state.dashboard.warnings) ? state.dashboard.warnings : [];
}

function getOllamaStatus() {
  return state.ollamaStatus && typeof state.ollamaStatus === "object" ? state.ollamaStatus : null;
}

function getAiLabStatusData() {
  return state.aiLabStatus && typeof state.aiLabStatus === "object" ? state.aiLabStatus : null;
}

function buildAiLabUrl(service) {
  if (!service || typeof service !== "object") {
    return "#";
  }

  const launchPath = String(service.launchPath || "/");
  if (service.id === "ollama") {
    return launchPath;
  }

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const hostname = window.location.hostname || "127.0.0.1";
  const normalizedPath = launchPath.startsWith("/") ? launchPath : `/${launchPath}`;
  return `${protocol}//${hostname}:${Number(service.port || 0)}${normalizedPath}`;
}

function lightsOnCount() {
  return getLights().filter((light) => light.isOn).length;
}

function averageBrightness() {
  const lights = getLights();
  if (!lights.length) {
    return 0;
  }

  return Math.round(
    lights.reduce((total, light) => total + Number(light.brightness || 0), 0) / lights.length
  );
}

function getRestIndex() {
  const sport = getSport();
  const wakeBattery = Number(sport && sport.recovery ? sport.recovery.wakeBodyBatteryAvg : 0);
  const sleepScore = Number(sport && sport.sleep ? sport.sleep.scoreAvg : 0);
  const debtHours = Number(sport && sport.analytics ? sport.analytics.sleepDebtHours : 0);
  const debtPenalty = clamp(debtHours * 3.2, 0, 36);
  const lightsBonus = getLights().length && lightsOnCount() === 0 ? 10 : 4;
  return clamp(Math.round(wakeBattery * 0.48 + sleepScore * 0.42 + lightsBonus - debtPenalty), 0, 100);
}

function topDayPart() {
  const sport = getSport();
  const parts = sport && sport.patterns && Array.isArray(sport.patterns.dayPart) ? sport.patterns.dayPart : [];
  if (!parts.length) {
    return null;
  }
  return [...parts].sort((left, right) => Number(right.trainingLoad || 0) - Number(left.trainingLoad || 0))[0];
}

function topWeekday() {
  const sport = getSport();
  const weekdays = sport && sport.patterns && Array.isArray(sport.patterns.weekday) ? sport.patterns.weekday : [];
  if (!weekdays.length) {
    return null;
  }
  return [...weekdays].sort((left, right) => Number(right.trainingLoad || 0) - Number(left.trainingLoad || 0))[0];
}

function lastAssistantMessage() {
  for (let index = state.assistantMessages.length - 1; index >= 0; index -= 1) {
    if (state.assistantMessages[index].role === "assistant") {
      return state.assistantMessages[index];
    }
  }
  return null;
}

function renderFrame() {
  document.body.classList.toggle("is-readable", state.preferences.readableMode);

  document.querySelectorAll("[data-frame='clock']").forEach((element) => {
    element.textContent = todayClockLabel();
  });

  document.querySelectorAll("[data-frame='date']").forEach((element) => {
    element.textContent = todayDateLabel();
  });

  const syncStatus = document.getElementById("syncStatus");
  if (syncStatus) {
    const warnings = getWarnings();
    const generatedAt = state.dashboard && state.dashboard.generatedAt ? formatDateTime(state.dashboard.generatedAt) : "n/a";
    const ollama = getOllamaStatus();
    const ollamaLabel = ollama
      ? ollama.available
        ? `Ollama actif${ollama.model ? ` (${ollama.model})` : ""}`
        : "Ollama indisponible"
      : "Ollama ...";
    syncStatus.textContent = warnings.length
      ? `${warnings.length} warning${warnings.length > 1 ? "s" : ""} - ${ollamaLabel} - ${generatedAt}`
      : `Hub stable - ${ollamaLabel} - ${generatedAt}`;
  }

  const globalBanner = document.getElementById("globalBanner");
  if (globalBanner) {
    if (state.fetchError) {
      globalBanner.hidden = false;
      globalBanner.textContent = `Lecture locale indisponible: ${state.fetchError}`;
    } else if (getWarnings().length) {
      globalBanner.hidden = false;
      globalBanner.innerHTML = getWarnings()
        .map((warning) => `${escapeHtml(warning.scope)}: ${escapeHtml(warning.message)}`)
        .join(" <br /> ");
    } else {
      globalBanner.hidden = true;
      globalBanner.textContent = "";
    }
  }
}

function renderHomePage() {
  const sport = getSport();
  const sleepSun = state.sleepSun;
  const summary = document.getElementById("homeSummaryCards");
  const scenario = document.getElementById("homeScenario");
  const highlights = document.getElementById("homeHighlights");
  const warnings = document.getElementById("homeWarnings");
  const ring = document.getElementById("homeRestRing");
  const scoreElement = document.getElementById("homeRestScore");
  const heroCopy = document.getElementById("homeHeroCopy");
  const modeNote = document.getElementById("homeModeNote");

  if (!summary || !scenario || !highlights || !warnings || !ring || !scoreElement || !heroCopy || !modeNote) {
    return;
  }

  const restIndex = getRestIndex();
  const coachAdvice =
    sport && sport.aiAnalysis && sport.aiAnalysis.coachSignals && sport.aiAnalysis.coachSignals.advice
      ? sport.aiAnalysis.coachSignals.advice
      : "Le hub reste pret pour une lecture rapide du soir.";
  const bedtimeLabel = sleepSun && sleepSun.bedtimeForSunrise ? sleepSun.bedtimeForSunrise.label : "--:--";
  const wakeNote = sleepSun && sleepSun.wake ? sleepSun.wake.note : "Plan sommeil indisponible.";
  const lights = getLights();
  const onCount = lightsOnCount();
  const recent7 = sport && sport.recent7 ? sport.recent7 : null;
  const lastBrief = lastAssistantMessage();
  const topActivity =
    sport && Array.isArray(sport.recentActivities) && sport.recentActivities[0] ? sport.recentActivities[0] : null;
  const topPart = topDayPart();

  ring.style.setProperty("--progress", String(restIndex));
  scoreElement.textContent = `${restIndex}%`;
  heroCopy.textContent = coachAdvice;
  modeNote.textContent = state.preferences.restModeActive ? "rest mode ready" : "rest mode paused";

  summary.innerHTML = [
    {
      href: "/maison.html",
      kicker: "Maison",
      value: `${onCount}/${lights.length || 0}`,
      note: onCount ? "lumieres actives" : "lumieres eteintes",
    },
    {
      href: "/sport.html",
      kicker: "Sport",
      value: recent7 ? `${formatNumber(recent7.activityCount, 0)} seances` : "--",
      note: recent7 ? `${formatNumber(recent7.distanceKm)} km sur 7 jours` : "resume sportif indisponible",
    },
    {
      href: "/assistant.html",
      kicker: "Assistant",
      value: lastBrief ? "brief charge" : "pret",
      note: truncateText(lastBrief ? lastBrief.content : coachAdvice, 84),
    },
    {
      href: "/chambre.html",
      kicker: "Sommeil",
      value: bedtimeLabel,
      note: sleepSun && sleepSun.sleepNeed ? `besoin moyen ${sleepSun.sleepNeed.label}` : "cible coucher",
    },
  ]
    .map(
      (card) => `
        <a class="summary-card summary-card-link" href="${card.href}">
          <span class="summary-card-kicker">${escapeHtml(card.kicker)}</span>
          <strong class="summary-card-value">${escapeHtml(card.value)}</strong>
          <p class="summary-card-note">${escapeHtml(card.note)}</p>
        </a>
      `
    )
    .join("");

  const scenarioCards = [
    {
      time: sleepSun && sleepSun.sunrise ? sleepSun.sunrise.label : "07:30",
      title: "Wake up",
      copy: sleepSun && sleepSun.sunrise ? `Lever cale sur le soleil a ${sleepSun.sunrise.label}.` : "Ouverture douce et lecture rapide du matin.",
      progress: "32%",
    },
    {
      time: topPart ? topPart.label : "Sport",
      title: "Sport",
      copy:
        sport && sport.aiAnalysis && sport.aiAnalysis.coachSignals && sport.aiAnalysis.coachSignals.tomorrowWorkout
          ? sport.aiAnalysis.coachSignals.tomorrowWorkout
          : "Bloc charge, recuperation et conseil du coach local.",
      progress: "52%",
    },
    {
      time: shiftTimeLabel(bedtimeLabel, -45),
      title: "Calm evening",
      copy: coachAdvice,
      progress: "68%",
    },
    {
      time: bedtimeLabel,
      title: "Night",
      copy: wakeNote,
      progress: "86%",
    },
  ];

  scenario.innerHTML = scenarioCards
    .map(
      (card) => `
        <article class="timeline-card">
          <span class="timeline-time">${escapeHtml(card.time)}</span>
          <h3 class="timeline-title">${escapeHtml(card.title)}</h3>
          <p class="timeline-copy">${escapeHtml(card.copy)}</p>
          <div class="timeline-meter" style="--timeline-progress:${card.progress}">
            <span></span>
          </div>
        </article>
      `
    )
    .join("");

  const highlightCards = [];
  if (topActivity) {
    highlightCards.push({
      kicker: "Derniere activite",
      title: topActivity.name,
      note: `${formatNumber(topActivity.distanceKm)} km • ${formatDurationHours(topActivity.durationHours)} • charge ${formatNumber(topActivity.trainingLoad, 0)}`,
      type: "",
    });
  }

  if (state.dashboard && state.dashboard.nutrition) {
    highlightCards.push({
      kicker: "Nutrition",
      title: `${formatNumber(state.dashboard.nutrition.totalToday, 0)} kcal`,
      note: `${formatNumber(state.dashboard.nutrition.count, 0)} repas saisis aujourd hui`,
      type: "",
    });
  } else {
    highlightCards.push({
      kicker: "Nutrition",
      title: "Flux indisponible",
      note: "Le service repas ne repond pas encore, la page reste prete pour lui.",
      type: "warning-card",
    });
  }

  if (state.dashboard && state.dashboard.fitness) {
    highlightCards.push({
      kicker: "Fitness",
      title: state.dashboard.fitness.athleteName || "Fitness",
      note: `${formatNumber(state.dashboard.fitness.activities.length, 0)} activites recentes`,
      type: "",
    });
  } else {
    highlightCards.push({
      kicker: "Fitness",
      title: "Bridge non charge",
      note: "Le resume Garmin local est disponible, mais le bridge fitness legacy est en echec.",
      type: "warning-card",
    });
  }

  highlightCards.push({
    kicker: "Rythme dominant",
    title: topPart ? topPart.label : "A definir",
    note: topPart ? `${formatNumber(topPart.activityCount, 0)} activites sur ce moment de jour.` : "Pas encore de tendance nette.",
    type: "",
  });

  highlights.innerHTML = highlightCards
    .map(
      (card) => `
        <article class="stack-card ${card.type}">
          <span class="stack-kicker">${escapeHtml(card.kicker)}</span>
          <h3 class="stack-title">${escapeHtml(card.title)}</h3>
          <p class="stack-note">${escapeHtml(card.note)}</p>
        </article>
      `
    )
    .join("");

  const warningCards = getWarnings().length
    ? getWarnings().map((warning) => ({
        kicker: warning.scope,
        title: "Signal hub",
        note: warning.message,
        type: "warning-card",
      }))
    : [
        {
          kicker: "Etat hub",
          title: "Tous les flux critiques repondent.",
          note: "Dashboard, sommeil et scenarios sont prets pour la tablette.",
          type: "ok-card",
        },
      ];

  warningCards.push({
    kicker: "Sommeil",
    title: bedtimeLabel === "--:--" ? "Plan du soir indisponible" : `Coucher cible ${bedtimeLabel}`,
    note: wakeNote,
    type: "",
  });

  warnings.innerHTML = warningCards
    .map(
      (card) => `
        <article class="stack-card ${card.type}">
          <span class="stack-kicker">${escapeHtml(card.kicker)}</span>
          <h3 class="stack-title">${escapeHtml(card.title)}</h3>
          <p class="stack-note">${escapeHtml(card.note)}</p>
        </article>
      `
    )
    .join("");
}

function renderMaisonPage() {
  const heroCopy = document.getElementById("houseHeroCopy");
  const metrics = document.getElementById("houseMetrics");
  const support = document.getElementById("houseSupport");
  const lightsContainer = document.getElementById("houseLights");

  if (!heroCopy || !metrics || !support || !lightsContainer) {
    return;
  }

  const sport = getSport();
  const sleepSun = state.sleepSun;
  const lights = getLights();
  const onCount = lightsOnCount();
  const brightness = averageBrightness();
  heroCopy.textContent = state.preferences.restModeActive
    ? "Le hub passe en lecture lente pour le soir: moins de bruit, plus de lisibilite."
    : "Le hub est actif, avec toutes les interactions locales pretes pour la maison.";

  metrics.innerHTML = [
    {
      kicker: "Lumieres",
      value: `${onCount}/${lights.length || 0}`,
      note: onCount ? "zones allumees" : "maison sombre",
    },
    {
      kicker: "Intensite moyenne",
      value: `${formatNumber(brightness, 0)}%`,
      note: "sur les zones locales",
    },
    {
      kicker: "Sommeil cible",
      value: sleepSun && sleepSun.bedtimeForSunrise ? sleepSun.bedtimeForSunrise.label : "--:--",
      note: "pour un reveil cale au soleil",
    },
    {
      kicker: "Body battery",
      value: sport && sport.recovery ? `${formatNumber(sport.recovery.wakeBodyBatteryAvg, 0)}` : "--",
      note: "lecture reveil",
    },
  ]
    .map(
      (card) => `
        <article class="metric-card">
          <span class="metric-card-kicker">${escapeHtml(card.kicker)}</span>
          <strong class="metric-card-value">${escapeHtml(card.value)}</strong>
          <p class="metric-card-note">${escapeHtml(card.note)}</p>
        </article>
      `
    )
    .join("");

  support.innerHTML = [
    {
      kicker: "Rest mode",
      title: state.preferences.restModeActive ? "Active" : "Inactive",
      note: state.preferences.restModeActive
        ? "L ecran reste oriente calme, les blocs prioritaires dominent."
        : "Le hub reste plus technique, utile en journee.",
    },
    {
      kicker: "Sommeil",
      title:
        sleepSun && sleepSun.wake && sleepSun.wake.deltaVsSunriseMinutes != null
          ? `${formatNumber(sleepSun.wake.deltaVsSunriseMinutes, 0)} min apres le soleil`
          : "Delta indisponible",
      note: sleepSun && sleepSun.wake ? sleepSun.wake.note : "Plan sommeil non charge.",
    },
    {
      kicker: "Warnings",
      title: getWarnings().length ? `${getWarnings().length} signaux a surveiller` : "Maison stable",
      note: getWarnings().length
        ? getWarnings().map((warning) => `${warning.scope}: ${warning.message}`).join(" / ")
        : "Aucune alerte critique en cours sur le hub.",
    },
  ]
    .map(
      (card) => `
        <article class="stack-card">
          <span class="stack-kicker">${escapeHtml(card.kicker)}</span>
          <h3 class="stack-title">${escapeHtml(card.title)}</h3>
          <p class="stack-note">${escapeHtml(card.note)}</p>
        </article>
      `
    )
    .join("");

  if (!lights.length) {
    lightsContainer.innerHTML = '<p class="empty-state">Aucune lumiere locale detectee pour le moment.</p>';
    return;
  }

  const visibleLights = lights.filter((light) => !isHiddenMaisonLight(light));
  const louisPairLights = visibleLights.filter(isLouisPairLight);
  const pairColorSource = louisPairLights.find((light) => light.supportsColor && light.colorHex);
  const louisPairCard =
    louisPairLights.length >= 2
      ? (() => {
          const provider = louisPairLights[0].provider;
          const uiId = `${provider}:louis-pair`;
          const allOn = louisPairLights.every((light) => light.isOn);
          const onCount = louisPairLights.filter((light) => light.isOn).length;
          const brightness = Math.round(
            louisPairLights.reduce((total, light) => total + Number(light.brightness || 0), 0) / louisPairLights.length
          );
          const statusLabel =
            onCount === 0 ? "Off" : onCount === louisPairLights.length ? "On" : `${onCount}/${louisPairLights.length}`;

          return `
            <article class="light-card" data-ui-id="${escapeHtml(uiId)}">
              <div class="light-head">
                <div>
                  <p class="light-name">Gauche + droite</p>
                  <p class="light-meta">Hue duo</p>
                </div>
                <button
                  class="toggle-chip ${allOn ? "is-on" : ""}"
                  type="button"
                  data-light-group-toggle="${escapeHtml(uiId)}"
                  data-provider="${escapeHtml(provider)}"
                  data-light-ids="${escapeHtml(louisPairLights.map((light) => light.providerLightId).join(","))}"
                  data-next-on="${allOn ? "false" : "true"}"
                >
                  ${escapeHtml(statusLabel)}
                </button>
              </div>
              <p class="light-note">Controle en une fois les deux lampes Louis.</p>
              <div class="range-wrap">
                <div class="range-head">
                  <span>Brightness</span>
                  <strong data-brightness-label="${escapeHtml(uiId)}">${formatNumber(brightness, 0)}%</strong>
                </div>
                <input
                  class="slider"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value="${clamp(brightness, 0, 100)}"
                  data-light-group-brightness="${escapeHtml(uiId)}"
                  data-provider="${escapeHtml(provider)}"
                  data-light-ids="${escapeHtml(louisPairLights.map((light) => light.providerLightId).join(","))}"
                />
              </div>
              ${
                louisPairLights.every((light) => light.supportsColor)
                  ? `
                    <div class="light-row">
                      <span class="light-note">Color tuning</span>
                      <input
                        class="color-input"
                        type="color"
                        value="${escapeHtml((pairColorSource && pairColorSource.colorHex) || "#ffffff")}"
                        data-light-group-color="${escapeHtml(uiId)}"
                        data-provider="${escapeHtml(provider)}"
                        data-light-ids="${escapeHtml(louisPairLights.map((light) => light.providerLightId).join(","))}"
                      />
                    </div>
                  `
                  : ""
              }
            </article>
          `;
        })()
      : "";

  const lightCards = visibleLights
    .map((light) => {
      const uiId = `${light.provider}:${light.providerLightId}`;
      return `
        <article class="light-card" data-ui-id="${escapeHtml(uiId)}">
          <div class="light-head">
            <div>
              <p class="light-name">${escapeHtml(light.name)}</p>
              <p class="light-meta">${escapeHtml(light.provider.toUpperCase())}</p>
            </div>
            <button
              class="toggle-chip ${light.isOn ? "is-on" : ""}"
              type="button"
              data-light-toggle="${escapeHtml(uiId)}"
              data-provider="${escapeHtml(light.provider)}"
              data-light-id="${escapeHtml(light.providerLightId)}"
              data-next-on="${light.isOn ? "false" : "true"}"
            >
              ${light.isOn ? "On" : "Off"}
            </button>
          </div>
          <div class="range-wrap">
            <div class="range-head">
              <span>Brightness</span>
              <strong data-brightness-label="${escapeHtml(uiId)}">${formatNumber(light.brightness, 0)}%</strong>
            </div>
            <input
              class="slider"
              type="range"
              min="0"
              max="100"
              step="1"
              value="${clamp(light.brightness, 0, 100)}"
              data-light-brightness="${escapeHtml(uiId)}"
              data-provider="${escapeHtml(light.provider)}"
              data-light-id="${escapeHtml(light.providerLightId)}"
            />
          </div>
          ${
            light.supportsColor
              ? `
                <div class="light-row">
                  <span class="light-note">Color tuning</span>
                  <input
                    class="color-input"
                    type="color"
                    value="${escapeHtml(light.colorHex || "#ffffff")}"
                    data-light-color="${escapeHtml(uiId)}"
                    data-provider="${escapeHtml(light.provider)}"
                    data-light-id="${escapeHtml(light.providerLightId)}"
                  />
                </div>
              `
              : ""
          }
        </article>
      `;
    })
    .join("");

  lightsContainer.innerHTML = `${louisPairCard}${lightCards}`;
}

function sparkline(values, color) {
  const safeValues = values.map((value) => (Number.isFinite(value) ? Number(value) : 0));
  if (!safeValues.length) {
    return "";
  }

  const width = 520;
  const height = 210;
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = max - min || 1;
  const points = safeValues
    .map((value, index) => {
      const x = safeValues.length === 1 ? width / 2 : (index / (safeValues.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 26) - 12;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;
  return `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.34"></stop>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"></stop>
        </linearGradient>
      </defs>
      <polyline fill="url(#sparkFill)" stroke="none" points="${areaPoints}"></polyline>
      <polyline fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="${points}"></polyline>
    </svg>
  `;
}

function renderSportPage() {
  const sport = getSport();
  const heroStats = document.getElementById("sportHeroStats");
  const coachSignal = document.getElementById("sportCoachSignal");
  const trend = document.getElementById("sportTrendChart");
  const calendar = document.getElementById("sportCalendar");
  const achievements = document.getElementById("sportAchievements");
  const records = document.getElementById("sportRecords");
  const metrics = document.getElementById("sportMetrics");
  const activities = document.getElementById("sportActivities");

  if (!heroStats || !coachSignal || !trend || !calendar || !achievements || !records || !metrics || !activities) {
    return;
  }

  if (!sport) {
    heroStats.innerHTML = '<p class="empty-state">Le resume sportif n est pas disponible pour le moment.</p>';
    coachSignal.innerHTML = "";
    trend.innerHTML = "";
    calendar.innerHTML = "";
    achievements.innerHTML = "";
    records.innerHTML = "";
    metrics.innerHTML = "";
    activities.innerHTML = "";
    return;
  }

  const recent7 = sport.recent7 || {};
  const recovery = sport.recovery || {};
  const sleep = sport.sleep || {};
  const coachSignals = sport.aiAnalysis && sport.aiAnalysis.coachSignals ? sport.aiAnalysis.coachSignals : null;
  const dailyTimeline = Array.isArray(sport.dailyTimeline) ? sport.dailyTimeline.slice(-14) : [];
  const weekPattern = topWeekday();

  heroStats.innerHTML = [
    { kicker: "Recuperation", value: `${formatNumber(recovery.wakeBodyBatteryAvg, 0)}`, note: "body battery reveil" },
    { kicker: "Sommeil", value: `${formatNumber(sleep.scoreAvg, 0)}`, note: "score moyen recent" },
    { kicker: "Charge 7 jours", value: `${formatNumber(recent7.trainingLoad, 0)}`, note: `${formatNumber(recent7.activityCount, 0)} seances` },
    { kicker: "Outdoor share", value: `${formatNumber(sport.overview ? sport.overview.outdoorShare : 0, 0)}%`, note: "sur le volume total" },
  ]
    .map(
      (card) => `
        <article class="metric-card">
          <span class="metric-card-kicker">${escapeHtml(card.kicker)}</span>
          <strong class="metric-card-value">${escapeHtml(card.value)}</strong>
          <p class="metric-card-note">${escapeHtml(card.note)}</p>
        </article>
      `
    )
    .join("");

  coachSignal.innerHTML = [
    { kicker: "Coach", title: coachSignals ? coachSignals.focus : "Recovery", note: coachSignals ? coachSignals.advice : "Le coach local n a pas encore produit de conseil exploitable." },
    { kicker: "Demain", title: coachSignals ? coachSignals.tomorrowWorkout : "Pas de seance cible", note: coachSignals ? `Risque fatigue: ${coachSignals.fatigueRisk}` : "Le moteur AI reste facultatif." },
    { kicker: "Rythme fort", title: weekPattern ? weekPattern.label : "Aucun pattern", note: weekPattern ? `${formatNumber(weekPattern.trainingLoad, 0)} de charge sur cette journee type.` : "Charge par jour indisponible." },
  ]
    .map(
      (card) => `
        <article class="stack-card">
          <span class="stack-kicker">${escapeHtml(card.kicker)}</span>
          <h3 class="stack-title">${escapeHtml(card.title)}</h3>
          <p class="stack-note">${escapeHtml(card.note)}</p>
        </article>
      `
    )
    .join("");

  const sleepScores = dailyTimeline.map((entry) => Number(entry.sleepScore || 0));
  const maxLoad = Math.max(1, ...dailyTimeline.map((entry) => Number(entry.trainingLoad || 0)));
  trend.innerHTML = `
    <div class="chart-value">
      <div>
        <div class="chart-big">${formatNumber(sleep.scoreAvg, 0)}/100</div>
        <div class="chart-meta">sleep score moyen recent</div>
      </div>
      <div class="tiny-pill">14 jours</div>
    </div>
    <div class="sparkline">${sparkline(sleepScores, "#d06a32")}</div>
    <div class="bar-strip">
      ${dailyTimeline
        .map((entry) => {
          const fill = clamp((Number(entry.trainingLoad || 0) / maxLoad) * 100, 8, 100);
          return `
            <div class="bar-column">
              <div class="bar-rail"><span class="bar-fill" style="height:${fill}%"></span></div>
              <span class="bar-label">${escapeHtml(formatDay(entry.date))}</span>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  calendar.innerHTML = dailyTimeline
    .map((entry) => {
      const level = clamp(Math.ceil(Number(entry.activityCount || 0) + Number(entry.trainingLoad || 0) / 220), 0, 3);
      return `
        <article class="calendar-card ${level ? "is-active" : ""}">
          <div class="calendar-head">
            <span class="calendar-day-label">${escapeHtml(formatDay(entry.date))}</span>
            <span class="calendar-intensity" data-level="${level}"></span>
          </div>
          <strong class="calendar-day-number">${escapeHtml(formatCalendarDate(entry.date))}</strong>
          <p class="calendar-note">${formatNumber(entry.activityCount || 0, 0)} act. • ${formatNumber(entry.trainingLoad || 0, 0)} load</p>
        </article>
      `;
    })
    .join("");

  const achievementsCards = [
    { kicker: "Consistent strike", title: `${formatNumber(recent7.activityCount || 0, 0)} sessions recentes`, note: `${formatNumber(recent7.distanceKm || 0)} km et ${formatDurationHours(recent7.durationHours || 0)} sur 7 jours.` },
    { kicker: "Weekend engine", title: weekPattern ? weekPattern.label : "Pattern libre", note: weekPattern ? `${formatNumber(weekPattern.distanceKm || 0)} km cumules ce jour type.` : "Pattern hebdomadaire non charge." },
    { kicker: "Recovery window", title: `${formatNumber(recovery.sleepHoursAvg || 0)} h`, note: `stress moyen ${formatNumber(recovery.stressAvg || 0, 0)} • FC repos ${formatNumber(recovery.restingHeartRateAvg || 0, 0)} bpm` },
  ];

  achievements.innerHTML = achievementsCards
    .map(
      (card) => `
        <article class="stack-card">
          <span class="stack-kicker">${escapeHtml(card.kicker)}</span>
          <h3 class="stack-title">${escapeHtml(card.title)}</h3>
          <p class="stack-note">${escapeHtml(card.note)}</p>
        </article>
      `
    )
    .join("");

  const recordTimeline =
    sport.analytics && Array.isArray(sport.analytics.recordTimeline) ? sport.analytics.recordTimeline.slice(-4) : [];
  records.innerHTML = recordTimeline.length
    ? recordTimeline
        .map(
          (record) => `
            <article class="stack-card">
              <span class="stack-kicker">${escapeHtml(record.label)}</span>
              <h3 class="stack-title">${escapeHtml(record.value)}</h3>
              <p class="stack-note">${escapeHtml(record.note)} • ${escapeHtml(record.date)}</p>
            </article>
          `
        )
        .join("")
    : '<p class="empty-state">Aucun record recent disponible.</p>';

  metrics.innerHTML = [
    { kicker: "Calories", value: `${formatNumber(sport.overview ? sport.overview.totalCalories : 0, 0)}`, note: "depensees sur la periode" },
    { kicker: "Duree active", value: formatDurationHours(sport.overview ? sport.overview.totalDurationHours : 0), note: "cumulee" },
    { kicker: "HRV moyen", value: `${formatNumber(sleep.hrvAvg || 0, 0)}`, note: "overnight hrv" },
    { kicker: "Dette sommeil", value: `${formatNumber(sport.analytics ? sport.analytics.sleepDebtHours : 0)} h`, note: "pression de recuperation" },
  ]
    .map(
      (card) => `
        <article class="summary-card">
          <span class="summary-card-kicker">${escapeHtml(card.kicker)}</span>
          <strong class="summary-card-value">${escapeHtml(card.value)}</strong>
          <p class="summary-card-note">${escapeHtml(card.note)}</p>
        </article>
      `
    )
    .join("");

  const recentActivities = Array.isArray(sport.recentActivities) ? sport.recentActivities.slice(0, 6) : [];
  activities.innerHTML = recentActivities.length
    ? recentActivities
        .map(
          (activity) => `
            <article class="activity-card">
              <div class="activity-top">
                <div>
                  <p class="activity-date">${escapeHtml(activity.dateLocal || "")}</p>
                  <h3 class="activity-name">${escapeHtml(activity.name)}</h3>
                </div>
                <span class="activity-chip">${escapeHtml(activity.typeKey || "sport")}</span>
              </div>
              <div class="activity-stats">
                <div class="activity-stat"><span>Distance</span><strong>${formatNumber(activity.distanceKm)} km</strong></div>
                <div class="activity-stat"><span>Duree</span><strong>${formatDurationHours(activity.durationHours)}</strong></div>
                <div class="activity-stat"><span>Charge</span><strong>${formatNumber(activity.trainingLoad || 0, 0)}</strong></div>
                <div class="activity-stat"><span>Lieu</span><strong>${escapeHtml(activity.locationName || "indoor")}</strong></div>
              </div>
            </article>
          `
        )
        .join("")
    : '<p class="empty-state">Aucune activite recente disponible.</p>';
}

function renderAssistantPage() {
  const summary = document.getElementById("assistantSummary");
  const aiLabGrid = document.getElementById("aiLabGrid");
  const prompts = document.getElementById("assistantQuickPrompts");
  const log = document.getElementById("assistantMessages");
  const context = document.getElementById("assistantContext");
  const lead = document.getElementById("assistantLead");
  const toggle = document.getElementById("assistantAutoSpeakToggle");

  if (!summary || !aiLabGrid || !prompts || !log || !context || !lead || !toggle) {
    return;
  }

  const sport = getSport();
  const sleepSun = state.sleepSun;
  const aiLab = getAiLabStatusData();
  const coachSignals = sport && sport.aiAnalysis && sport.aiAnalysis.coachSignals ? sport.aiAnalysis.coachSignals : null;
  const ollama = getOllamaStatus();
  const aiLabServices = aiLab && Array.isArray(aiLab.services) ? aiLab.services : [];
  const messages = state.assistantMessages.length
    ? state.assistantMessages
    : [{ role: "assistant", content: DEFAULT_ASSISTANT_GREETING }];
  const aiLabValue = aiLab ? `${formatNumber(aiLab.availableCount || 0, 0)}/${formatNumber(aiLab.totalCount || 0, 0)} actifs` : "verification...";
  const aiLabNote = aiLabServices.length
    ? `${aiLabServices.map((service) => service.title).join(" + ")} disponibles dans le hub.`
    : "Les services IA locaux seront listes ici.";
  const ollamaValue = ollama
    ? ollama.available
      ? "actif"
      : "indisponible"
    : "verification...";
  const ollamaNote = ollama
    ? ollama.available
      ? `${ollama.model || "modele auto"}${ollama.version ? ` - v${ollama.version}` : ""}${
          ollama.loadedModelCount ? ` - ${ollama.loadedModelCount} charge` : ""
        }`
      : ollama.message || "Le moteur local ne repond pas."
    : "Lecture du moteur local en cours.";

  lead.textContent = state.preferences.restModeActive
    ? "Ultra-dark mode active. Minimal distractions for the evening flow."
    : "Le hub reste ouvert a la conversation et au pilotage rapide.";
  toggle.textContent = state.preferences.autoSpeak ? "Voice ON" : "Voice OFF";
  toggle.classList.toggle("is-active", state.preferences.autoSpeak);

  summary.innerHTML = [
    { kicker: "Brief", value: coachSignals ? coachSignals.advice : "Le brief local apparaitra ici.", note: coachSignals ? `Focus ${coachSignals.focus}` : "Le resume AI est facultatif." },
    { kicker: "Sommeil", value: sleepSun && sleepSun.bedtimeForSunrise ? `Coucher ${sleepSun.bedtimeForSunrise.label}` : "n/a", note: sleepSun && sleepSun.wake ? sleepSun.wake.note : "Plan sommeil indisponible." },
    { kicker: "Maison", value: `${lightsOnCount()}/${getLights().length || 0} zones on`, note: state.preferences.silentMode ? "mode silencieux actif" : "notifications maison normales" },
    { kicker: "Ollama", value: ollamaValue, note: ollamaNote },
    { kicker: "AI Lab", value: aiLabValue, note: aiLabNote },
  ]
    .map(
      (card) => `
        <article class="assistant-summary-card">
          <span class="summary-card-kicker">${escapeHtml(card.kicker)}</span>
          <p class="summary-card-note">${escapeHtml(card.value)}</p>
          <p class="stack-note">${escapeHtml(card.note)}</p>
        </article>
      `
    )
    .join("");

  aiLabGrid.innerHTML = aiLabServices.length
    ? aiLabServices
        .map(
          (service) => `
            <article class="assistant-summary-card">
              <div class="light-row">
                <div>
                  <span class="summary-card-kicker">${escapeHtml(service.title)}</span>
                  <p class="summary-card-note">${escapeHtml(service.description)}</p>
                </div>
                <span class="${service.available ? "tiny-pill" : "warning-pill"}">${service.available ? "actif" : "off"}</span>
              </div>
              <p class="stack-note">${
                service.available
                  ? escapeHtml(`Toujours on - port ${service.port}`)
                  : escapeHtml(service.message || "Service indisponible.")
              }</p>
              <div class="button-row">
                <a class="ghost-button" href="${escapeHtml(buildAiLabUrl(service))}" target="_blank" rel="noreferrer">Ouvrir</a>
              </div>
            </article>
          `
        )
        .join("")
    : '<p class="empty-state">Aucun service IA local disponible pour le moment.</p>';

  prompts.innerHTML = QUICK_PROMPTS.map(
    (prompt) => `<button class="prompt-button" type="button" data-prompt="${escapeHtml(prompt)}">${escapeHtml(prompt)}</button>`
  ).join("");

  log.innerHTML = messages
    .map(
      (message) => `
        <article class="assistant-bubble ${message.role}">
          <div class="assistant-bubble-role">${message.role === "user" ? "User" : "Assistant"}</div>
          <div class="assistant-bubble-copy">${escapeHtml(message.content)}</div>
        </article>
      `
    )
    .join("");

  const contextCards = [
    { kicker: "Charge 7 jours", title: sport && sport.recent7 ? `${formatNumber(sport.recent7.trainingLoad || 0, 0)}` : "--", note: sport && sport.recent7 ? `${formatNumber(sport.recent7.activityCount || 0, 0)} seances / ${formatNumber(sport.recent7.distanceKm || 0)} km` : "resume sportif absent" },
    { kicker: "Dette sommeil", title: sport && sport.analytics ? `${formatNumber(sport.analytics.sleepDebtHours || 0)} h` : "--", note: sleepSun && sleepSun.sleepNeed ? `besoin moyen ${sleepSun.sleepNeed.label}` : "lecture sommeil non chargee" },
    { kicker: "Dernier message", title: lastAssistantMessage() ? "memoire locale active" : "session vide", note: truncateText(lastAssistantMessage() ? lastAssistantMessage().content : DEFAULT_ASSISTANT_GREETING, 96) },
  ];

  context.innerHTML = contextCards
    .map(
      (card) => `
        <article class="stack-card">
          <span class="stack-kicker">${escapeHtml(card.kicker)}</span>
          <h3 class="stack-title">${escapeHtml(card.title)}</h3>
          <p class="stack-note">${escapeHtml(card.note)}</p>
        </article>
      `
    )
    .join("");
}

function renderAutomationsPage() {
  const summary = document.getElementById("automationSummary");
  const side = document.getElementById("automationSide");
  const timeline = document.getElementById("automationTimeline");
  const templates = document.getElementById("automationTemplates");
  const lead = document.getElementById("automationLead");
  const prefRest = document.getElementById("prefRestMode");
  const prefSilent = document.getElementById("prefSilentMode");
  const prefReadable = document.getElementById("prefReadableMode");
  const prefAutoSpeak = document.getElementById("prefAutoSpeak");

  if (!summary || !side || !timeline || !templates || !lead) {
    return;
  }

  const sleepSun = state.sleepSun;
  const sport = getSport();
  const bedtime = sleepSun && sleepSun.bedtimeForSunrise ? sleepSun.bedtimeForSunrise.label : "--:--";
  const dimTime = shiftTimeLabel(bedtime, -30);

  lead.textContent = sleepSun && sleepSun.wake
    ? sleepSun.wake.note
    : "La routine du soir se base sur le soleil, la dette de sommeil et les preferences locales.";

  summary.innerHTML = [
    { kicker: "Routine start", value: dimTime, note: "pre-dim et silence progressif" },
    { kicker: "Sleep target", value: bedtime, note: sleepSun && sleepSun.sleepNeed ? sleepSun.sleepNeed.label : "besoin moyen" },
    { kicker: "Wake delta", value: sleepSun && sleepSun.wake && sleepSun.wake.deltaVsSunriseMinutes != null ? `${formatNumber(sleepSun.wake.deltaVsSunriseMinutes, 0)} min` : "--", note: "ecart au lever du soleil" },
  ]
    .map(
      (card) => `
        <article class="summary-card">
          <span class="summary-card-kicker">${escapeHtml(card.kicker)}</span>
          <strong class="summary-card-value">${escapeHtml(card.value)}</strong>
          <p class="summary-card-note">${escapeHtml(card.note)}</p>
        </article>
      `
    )
    .join("");

  side.innerHTML = [
    { kicker: "Deep sleep", title: sport && sport.sleep && Number.isFinite(sport.sleep.scoreAvg) ? `${formatNumber(sport.sleep.scoreAvg, 0)} / 100` : "lecture indisponible", note: "score sommeil recent" },
    { kicker: "White noise", title: state.preferences.whiteNoise ? "Armed" : "Muted", note: state.preferences.whiteNoise ? "rain forest discret en fin de journee" : "aucun masque sonore local" },
    { kicker: "Lights", title: `${lightsOnCount()}/${getLights().length || 0} zones on`, note: "la scene peut etre appliquee en un toucher" },
  ]
    .map(
      (card) => `
        <article class="stack-card">
          <span class="stack-kicker">${escapeHtml(card.kicker)}</span>
          <h3 class="stack-title">${escapeHtml(card.title)}</h3>
          <p class="stack-note">${escapeHtml(card.note)}</p>
        </article>
      `
    )
    .join("");

  timeline.innerHTML = [
    { kicker: "Trigger", title: `At ${dimTime}`, note: "Le hub reduit la stimulation visuelle et passe en lecture lente." },
    { kicker: "Action", title: "Dim all lights", note: "La scene calme place toutes les lumieres a intensite basse." },
    { kicker: "Action", title: state.preferences.whiteNoise ? "White noise armed" : "White noise muted", note: "Le bruit blanc reste local a la routine du soir." },
    { kicker: "Wake", title: sleepSun && sleepSun.sunrise ? `Sunrise ${sleepSun.sunrise.label}` : "Sunrise sync", note: sleepSun && sleepSun.wake ? sleepSun.wake.note : "La routine calcule le prochain reveil utile." },
  ]
    .map(
      (step) => `
        <article class="timeline-card">
          <span class="stack-kicker">${escapeHtml(step.kicker)}</span>
          <h3 class="timeline-title">${escapeHtml(step.title)}</h3>
          <p class="timeline-copy">${escapeHtml(step.note)}</p>
        </article>
      `
    )
    .join("");

  templates.innerHTML = [
    { title: "Midnight Reading", note: "Ambre tres doux, voix coupee, retour a la page chambre.", href: "/chambre.html" },
    { title: "Silent Guard", note: "Blackout ecran et silence local, avec retour manuel au toucher.", href: "/chambre.html" },
    { title: "Calm Lounge", note: "Baisse les lumieres locales et laisse l assistant disponible.", href: "/maison.html" },
  ]
    .map(
      (template) => `
        <a class="stack-card summary-card-link" href="${template.href}">
          <span class="stack-kicker">Template</span>
          <h3 class="stack-title">${escapeHtml(template.title)}</h3>
          <p class="stack-note">${escapeHtml(template.note)}</p>
        </a>
      `
    )
    .join("");

  if (prefRest) prefRest.checked = state.preferences.restModeActive;
  if (prefSilent) prefSilent.checked = state.preferences.silentMode;
  if (prefReadable) prefReadable.checked = state.preferences.readableMode;
  if (prefAutoSpeak) prefAutoSpeak.checked = state.preferences.autoSpeak;
}

function renderBedroomPage() {
  const lead = document.getElementById("bedroomLead");
  const target = document.getElementById("bedroomTarget");
  const protocol = document.getElementById("bedroomProtocol");
  const environment = document.getElementById("bedroomEnvironment");
  const callout = document.getElementById("bedroomCallout");
  const notes = document.getElementById("bedroomNotes");

  if (!lead || !target || !protocol || !environment || !callout || !notes) {
    return;
  }

  const sleepSun = state.sleepSun;
  const sport = getSport();
  const bedtime = sleepSun && sleepSun.bedtimeForSunrise ? sleepSun.bedtimeForSunrise.label : "--:--";
  const sleepScore = sport && sport.sleep ? sport.sleep.scoreAvg : null;
  const debt = sport && sport.analytics ? sport.analytics.sleepDebtHours : null;

  lead.textContent = sleepSun && sleepSun.wake
    ? `${sleepSun.wake.note} Preparation pour deep sleep.`
    : "Minimal distraction. Le protocole chambre reste aligne sur le coucher cible.";

  target.innerHTML = [
    { kicker: "Target", title: "18 C", note: "cible chambre recommandee pour le sommeil" },
    { kicker: "Security", title: state.preferences.silentMode ? "Perimeter quiet" : "Normal notifications", note: state.preferences.silentMode ? "Le hub coupe les interruptions parasites." : "Le hub reste bavard." },
    { kicker: "Sunrise", title: sleepSun && sleepSun.sunrise ? sleepSun.sunrise.label : "--:--", note: "repere reveil naturel" },
  ]
    .map(
      (card) => `
        <article class="stack-card">
          <span class="stack-kicker">${escapeHtml(card.kicker)}</span>
          <h3 class="stack-title">${escapeHtml(card.title)}</h3>
          <p class="stack-note">${escapeHtml(card.note)}</p>
        </article>
      `
    )
    .join("");

  protocol.innerHTML = [
    { title: "Sleep protocol", note: `Debut ${bedtime}. Diminution visuelle, silence local et baisse des lumieres.` },
    { title: "Wake alignment", note: sleepSun && sleepSun.bedtimeForSunrise ? sleepSun.bedtimeForSunrise.note : "Cible reveil non calculee." },
    { title: "Recovery pressure", note: Number.isFinite(debt) && Number.isFinite(sleepScore) ? `Dette sommeil ${formatNumber(debt)} h pour un score recent a ${formatNumber(sleepScore, 0)}.` : "Les metrics sommeil ne sont pas toutes disponibles." },
  ]
    .map(
      (item) => `
        <article class="stack-card">
          <span class="stack-kicker">Protocol</span>
          <h3 class="stack-title">${escapeHtml(item.title)}</h3>
          <p class="stack-note">${escapeHtml(item.note)}</p>
        </article>
      `
    )
    .join("");

  environment.innerHTML = [
    { title: "Night light", note: lightsOnCount() ? `${lightsOnCount()} zone(s) encore active(s)` : "maison deja sombre" },
    { title: "Reading mode", note: state.preferences.readableMode ? "taille texte relevee" : "mode standard" },
    { title: "White noise", note: state.preferences.whiteNoise ? "actif" : "off" },
    { title: "Silent mode", note: state.preferences.silentMode ? "actif" : "off" },
  ]
    .map(
      (item) => `
        <article class="chip-card">
          <span class="stack-kicker">Ambient</span>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.note)}</span>
        </article>
      `
    )
    .join("");

  callout.innerHTML = `
    <span class="stack-kicker">Restful state</span>
    <h3 class="stack-title">${state.preferences.restModeActive ? "The house is breathing with you." : "Rest mode is paused."}</h3>
    <p class="stack-note">${
      sport && sport.aiAnalysis && sport.aiAnalysis.coachSignals
        ? escapeHtml(sport.aiAnalysis.coachSignals.advice)
        : "Le hub gardera seulement les signaux forts pour ne pas parasiter l endormissement."
    }</p>
  `;

  notes.innerHTML = [
    { kicker: "Sleep score", value: Number.isFinite(sleepScore) ? `${formatNumber(sleepScore, 0)}` : "--", note: "moyenne recente" },
    { kicker: "Sleep need", value: sleepSun && sleepSun.sleepNeed ? sleepSun.sleepNeed.label : "--", note: "besoin moyen constate" },
    { kicker: "Wake", value: sleepSun && sleepSun.wake ? sleepSun.wake.averageLabel : "--", note: "heure moyenne reveil" },
    { kicker: "Debt", value: Number.isFinite(debt) ? `${formatNumber(debt)} h` : "--", note: "recuperation a lisser" },
  ]
    .map(
      (card) => `
        <article class="summary-card">
          <span class="summary-card-kicker">${escapeHtml(card.kicker)}</span>
          <strong class="summary-card-value">${escapeHtml(card.value)}</strong>
          <p class="summary-card-note">${escapeHtml(card.note)}</p>
        </article>
      `
    )
    .join("");
}

function renderRssPage() {
  const pageConfig = RSS_PAGE_CONFIG[state.page];
  const hero = document.getElementById("rssHero");
  const stats = document.getElementById("rssStats");
  const sources = document.getElementById("rssSources");
  const items = document.getElementById("rssItems");

  if (!pageConfig || !hero || !stats || !sources || !items) {
    return;
  }

  const group = pageConfig.group;
  const digest = state.rssDigests[group];
  const loading = Boolean(state.rssLoading[group]);
  const error = state.rssErrors[group] || "";
  const feedList = digest && Array.isArray(digest.feeds) ? digest.feeds : [];
  const itemList = digest && Array.isArray(digest.items) ? digest.items : [];
  const okFeeds = feedList.filter((feed) => feed.ok).length;

  hero.innerHTML = `
    <p class="eyebrow">${escapeHtml(pageConfig.eyebrow)}</p>
    <h2 class="display-title">${escapeHtml(digest ? digest.title : "Flux RSS")}</h2>
    <p class="soft-copy">${escapeHtml(
      error || (digest ? digest.description : loading ? "Chargement des flux en cours." : "Flux prets a etre charges.")
    )}</p>
  `;

  stats.innerHTML = [
    {
      kicker: "Sources",
      value: digest ? `${okFeeds}/${feedList.length}` : "--",
      note: loading ? "synchronisation" : "flux actifs",
    },
    {
      kicker: "Elements",
      value: digest ? `${itemList.length}` : "--",
      note: state.page === "podcasts" ? "episodes recents" : "articles recents",
    },
    {
      kicker: "Derniere lecture",
      value: digest ? formatDateTime(digest.generatedAt) : "--",
      note: digest ? `cache ${Math.round((digest.cacheTtlMs || 0) / 60000)} min` : "non charge",
    },
  ]
    .map(
      (card) => `
        <article class="summary-card">
          <span class="summary-card-kicker">${escapeHtml(card.kicker)}</span>
          <strong class="summary-card-value">${escapeHtml(card.value)}</strong>
          <p class="summary-card-note">${escapeHtml(card.note)}</p>
        </article>
      `
    )
    .join("");

  sources.innerHTML = feedList.length
    ? feedList
        .map(
          (feed) => `
            <a class="stack-card summary-card-link rss-source-card" href="${escapeHtml(feed.homepage || feed.url)}" target="_blank" rel="noreferrer">
              <span class="stack-kicker">${escapeHtml(feed.category || "RSS")}</span>
              <h3 class="stack-title">${escapeHtml(feed.title)}</h3>
              <p class="stack-note">${feed.ok ? `${feed.itemCount} elements lus` : escapeHtml(feed.message || "Flux indisponible")}</p>
            </a>
          `
        )
        .join("")
    : `<div class="empty-state">${loading ? "Chargement des sources RSS." : "Sources RSS non chargees."}</div>`;

  if (error) {
    items.innerHTML = `<div class="empty-state">${escapeHtml(error)}</div>`;
    return;
  }

  if (!itemList.length) {
    items.innerHTML = `<div class="empty-state">${loading ? "Chargement des elements RSS." : pageConfig.empty}</div>`;
    return;
  }

  items.innerHTML = itemList
    .map(
      (item) => `
        <article class="rss-card">
          <div class="rss-card-meta">
            <span>${escapeHtml(item.feedTitle || "RSS")}</span>
            <span>${escapeHtml(formatRssDate(item.publishedAt))}</span>
          </div>
          <h3 class="rss-card-title">
            <a href="${escapeHtml(item.link)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a>
          </h3>
          <p class="rss-card-copy">${escapeHtml(item.summary || "Resume indisponible.")}</p>
          <div class="rss-card-actions">
            <span class="tiny-pill">${escapeHtml(item.category || "RSS")}</span>
            ${
              item.audioUrl
                ? `<a class="text-link" href="${escapeHtml(item.audioUrl)}" target="_blank" rel="noreferrer">Audio</a>`
                : ""
            }
            <a class="text-link" href="${escapeHtml(item.link)}" target="_blank" rel="noreferrer">Ouvrir</a>
          </div>
        </article>
      `
    )
    .join("");
}

function renderPage() {
  renderFrame();
  renderHomePage();
  renderMaisonPage();
  renderSportPage();
  renderAssistantPage();
  renderAutomationsPage();
  renderBedroomPage();
  renderRssPage();
}

function setPreferencesFromInputs() {
  const prefRest = document.getElementById("prefRestMode");
  const prefSilent = document.getElementById("prefSilentMode");
  const prefReadable = document.getElementById("prefReadableMode");
  const prefAutoSpeak = document.getElementById("prefAutoSpeak");

  if (prefRest) state.preferences.restModeActive = prefRest.checked;
  if (prefSilent) state.preferences.silentMode = prefSilent.checked;
  if (prefReadable) state.preferences.readableMode = prefReadable.checked;
  if (prefAutoSpeak) state.preferences.autoSpeak = prefAutoSpeak.checked;

  persistPreferences();
  renderFrame();
  renderAutomationsPage();
  renderAssistantPage();
  renderBedroomPage();
}

function showNightOverlay(title, copy) {
  const overlay = document.getElementById("nightOverlay");
  const overlayTitle = document.getElementById("nightOverlayTitle");
  const overlayCopy = document.getElementById("nightOverlayCopy");
  if (!overlay || !overlayTitle || !overlayCopy) {
    return;
  }

  overlayTitle.textContent = title;
  overlayCopy.textContent = copy;
  overlay.hidden = false;
  window.clearTimeout(state.overlayTimer);
  state.overlayTimer = window.setTimeout(() => {
    overlay.hidden = true;
  }, 6000);
}

function hideNightOverlay() {
  const overlay = document.getElementById("nightOverlay");
  if (overlay) {
    overlay.hidden = true;
  }
  window.clearTimeout(state.overlayTimer);
}

function scheduleRefresh(delayOverride) {
  window.clearTimeout(state.refreshTimer);
  const delay = Number.isFinite(delayOverride)
    ? Number(delayOverride)
    : state.dashboard && Number.isFinite(state.dashboard.refreshIntervalMs)
      ? Number(state.dashboard.refreshIntervalMs)
      : 60_000;
  state.refreshTimer = window.setTimeout(() => {
    loadData(false).catch(() => {});
  }, delay);
}

async function loadData(forceLive = false) {
  try {
    state.fetchError = "";
    const dashboardPath = forceLive ? "/api/dashboard?live=1" : "/api/dashboard";
    const [dashboardResult, sleepSunResult, ollamaStatusResult, aiLabStatusResult] = await Promise.allSettled([
      apiGet(dashboardPath),
      apiGet("/api/sleep-sun"),
      apiGet("/api/ollama/status"),
      apiGet("/api/ai-lab/status"),
    ]);

    if (dashboardResult.status === "fulfilled") {
      state.dashboard = dashboardResult.value;
    } else {
      throw dashboardResult.reason;
    }

    if (sleepSunResult.status === "fulfilled") {
      state.sleepSun = sleepSunResult.value;
    }

    if (ollamaStatusResult.status === "fulfilled") {
      state.ollamaStatus = ollamaStatusResult.value;
    } else {
      state.ollamaStatus = {
        ok: false,
        available: false,
        message:
          ollamaStatusResult.reason && ollamaStatusResult.reason.message
            ? ollamaStatusResult.reason.message
            : "Ollama indisponible.",
      };
    }

    if (aiLabStatusResult.status === "fulfilled") {
      state.aiLabStatus = aiLabStatusResult.value;
    } else {
      state.aiLabStatus = {
        ok: false,
        services: [],
        availableCount: 0,
        totalCount: 0,
      };
    }

  } catch (error) {
    state.fetchError = error && error.message ? error.message : "Dashboard indisponible.";
  } finally {
    scheduleRefresh(state.fetchError ? 15_000 : undefined);
    renderPage();
  }
}

async function loadRssDigest(group, forceLive = false) {
  if (!group) {
    return;
  }

  state.rssLoading[group] = true;
  state.rssErrors[group] = "";
  renderRssPage();

  try {
    const path = forceLive ? `/api/rss/${encodeURIComponent(group)}?live=1` : `/api/rss/${encodeURIComponent(group)}`;
    state.rssDigests[group] = await apiGet(path);
  } catch (error) {
    const routeMissing =
      error &&
      error.statusCode === 404 &&
      /route not found|notfound/i.test(`${error.message || ""} ${error.payload && error.payload.error ? error.payload.error : ""}`);
    state.rssErrors[group] = routeMissing
      ? "API RSS indisponible sur ce serveur. Redemarrez le hub ou deployeez la derniere version."
      : error && error.message
        ? error.message
        : "Flux RSS indisponibles.";
  } finally {
    state.rssLoading[group] = false;
    renderRssPage();
  }
}

async function toggleLight(provider, lightId, nextOn) {
  await apiPost(`/api/lights/${encodeURIComponent(provider)}/${encodeURIComponent(lightId)}/toggle`, {
    on: nextOn,
  });
}

async function setLightBrightness(provider, lightId, brightness) {
  await apiPost(`/api/lights/${encodeURIComponent(provider)}/${encodeURIComponent(lightId)}/brightness`, {
    brightness: clamp(brightness, 0, 100),
  });
}

async function setLightColor(provider, lightId, color) {
  await apiPost(`/api/lights/${encodeURIComponent(provider)}/${encodeURIComponent(lightId)}/color`, {
    color,
  });
}

async function toggleLightGroup(provider, lightIds, nextOn) {
  for (const lightId of lightIds) {
    await toggleLight(provider, lightId, nextOn);
  }
}

async function setLightGroupBrightness(provider, lightIds, brightness) {
  for (const lightId of lightIds) {
    await setLightBrightness(provider, lightId, brightness);
  }
}

async function setLightGroupColor(provider, lightIds, color) {
  for (const lightId of lightIds) {
    await setLightColor(provider, lightId, color);
  }
}

async function applyScene(sceneKey) {
  const scene = scenePresets[sceneKey];
  const lights = getLights();
  if (!scene || !lights.length) {
    return;
  }

  for (const light of lights) {
    await toggleLight(light.provider, light.providerLightId, Boolean(scene.on));
    if (scene.on) {
      await setLightBrightness(light.provider, light.providerLightId, scene.brightness);
      if (light.supportsColor && scene.color) {
        await setLightColor(light.provider, light.providerLightId, scene.color);
      }
    }
  }

  await loadData(true);
}

async function sendAssistantPrompt(prompt) {
  const content = String(prompt || "").trim();
  if (!content || state.assistantSending) {
    return;
  }

  const input = document.getElementById("assistantInput");
  state.assistantSending = true;
  state.assistantMessages = sanitizeMessages([...state.assistantMessages, { role: "user", content }]);
  persistAssistantMessages();
  renderAssistantPage();
  if (input) {
    input.value = "";
  }

  try {
    const response = await apiPost("/api/ollama/chat", {
      messages: state.assistantMessages,
    });
    const assistantContent =
      response && response.message && typeof response.message.content === "string"
        ? response.message.content.trim()
        : "";

    if (!assistantContent) {
      throw new Error("Aucune reponse Ollama recue.");
    }

    state.assistantMessages = sanitizeMessages([
      ...state.assistantMessages,
      { role: "assistant", content: assistantContent },
    ]);
    persistAssistantMessages();
    renderAssistantPage();

    if (state.preferences.autoSpeak && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(assistantContent);
      utterance.lang = "fr-FR";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  } catch (error) {
    state.assistantMessages = sanitizeMessages([
      ...state.assistantMessages,
      { role: "assistant", content: `Erreur assistant: ${error && error.message ? error.message : "reponse indisponible."}` },
    ]);
    persistAssistantMessages();
    renderAssistantPage();
  } finally {
    state.assistantSending = false;
  }
}

function bindCommonEvents() {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.nav === state.page);
  });

  document.querySelectorAll("[data-action='refresh']").forEach((button) => {
    button.addEventListener("click", () => {
      const rssGroup = currentRssGroup();
      if (rssGroup) {
        loadRssDigest(rssGroup, true)
          .catch(() => {})
          .finally(() => loadData(false).catch(() => {}));
        return;
      }
      loadData(true).catch(() => {});
    });
  });

  const overlay = document.getElementById("nightOverlay");
  if (overlay) {
    overlay.addEventListener("click", hideNightOverlay);
  }

  const houseLights = document.getElementById("houseLights");
  if (houseLights) {
    houseLights.addEventListener("click", (event) => {
      const groupToggle = event.target.closest("[data-light-group-toggle]");
      if (groupToggle) {
        toggleLightGroup(
          groupToggle.dataset.provider,
          parseLightIds(groupToggle.dataset.lightIds),
          groupToggle.dataset.nextOn === "true"
        )
          .then(() => loadData(true))
          .catch((error) => {
            state.fetchError = error.message || "Impossible de changer le groupe de lumieres.";
            renderFrame();
          });
        return;
      }

      const toggle = event.target.closest("[data-light-toggle]");
      if (!toggle) return;
      toggleLight(toggle.dataset.provider, toggle.dataset.lightId, toggle.dataset.nextOn === "true")
        .then(() => loadData(true))
        .catch((error) => {
          state.fetchError = error.message || "Impossible de changer la lumiere.";
          renderFrame();
        });
    });

    houseLights.addEventListener("input", (event) => {
      const groupSlider = event.target.closest("[data-light-group-brightness]");
      if (groupSlider) {
        const label = document.querySelector(`[data-brightness-label="${groupSlider.dataset.lightGroupBrightness}"]`);
        if (label) label.textContent = `${groupSlider.value}%`;
        return;
      }

      const slider = event.target.closest("[data-light-brightness]");
      if (!slider) return;
      const label = document.querySelector(`[data-brightness-label="${slider.dataset.lightBrightness}"]`);
      if (label) label.textContent = `${slider.value}%`;
    });

    houseLights.addEventListener("change", (event) => {
      const groupSlider = event.target.closest("[data-light-group-brightness]");
      if (groupSlider) {
        setLightGroupBrightness(
          groupSlider.dataset.provider,
          parseLightIds(groupSlider.dataset.lightIds),
          Number(groupSlider.value)
        )
          .then(() => loadData(true))
          .catch((error) => {
            state.fetchError = error.message || "Impossible de regler la luminosite du groupe.";
            renderFrame();
          });
        return;
      }

      const slider = event.target.closest("[data-light-brightness]");
      if (slider) {
        setLightBrightness(slider.dataset.provider, slider.dataset.lightId, Number(slider.value))
          .then(() => loadData(true))
          .catch((error) => {
            state.fetchError = error.message || "Impossible de regler la luminosite.";
            renderFrame();
        });
        return;
      }

      const groupColor = event.target.closest("[data-light-group-color]");
      if (groupColor) {
        setLightGroupColor(groupColor.dataset.provider, parseLightIds(groupColor.dataset.lightIds), groupColor.value)
          .then(() => loadData(true))
          .catch((error) => {
            state.fetchError = error.message || "Impossible de changer la couleur du groupe.";
            renderFrame();
          });
        return;
      }

      const color = event.target.closest("[data-light-color]");
      if (color) {
        setLightColor(color.dataset.provider, color.dataset.lightId, color.value)
          .then(() => loadData(true))
          .catch((error) => {
            state.fetchError = error.message || "Impossible de changer la couleur.";
            renderFrame();
          });
      }
    });
  }

  document.querySelectorAll("[data-scene]").forEach((button) => {
    button.addEventListener("click", () => {
      applyScene(button.dataset.scene).catch((error) => {
        state.fetchError = error.message || "Impossible d appliquer la scene.";
        renderFrame();
      });
    });
  });

  const assistantForm = document.getElementById("assistantForm");
  const assistantInput = document.getElementById("assistantInput");
  const assistantPrompts = document.getElementById("assistantQuickPrompts");
  const assistantReset = document.getElementById("assistantResetButton");
  const assistantAutoSpeakToggle = document.getElementById("assistantAutoSpeakToggle");

  if (assistantForm && assistantInput) {
    assistantForm.addEventListener("submit", (event) => {
      event.preventDefault();
      sendAssistantPrompt(assistantInput.value).catch(() => {});
    });
  }

  if (assistantPrompts) {
    assistantPrompts.addEventListener("click", (event) => {
      const button = event.target.closest("[data-prompt]");
      if (!button) return;
      sendAssistantPrompt(button.dataset.prompt || "").catch(() => {});
    });
  }

  if (assistantReset) {
    assistantReset.addEventListener("click", () => {
      state.assistantMessages = [];
      persistAssistantMessages();
      renderAssistantPage();
    });
  }

  if (assistantAutoSpeakToggle) {
    assistantAutoSpeakToggle.addEventListener("click", () => {
      state.preferences.autoSpeak = !state.preferences.autoSpeak;
      persistPreferences();
      renderAssistantPage();
      renderAutomationsPage();
    });
  }

  const automationPrefForm = document.getElementById("automationPreferences");
  if (automationPrefForm) {
    automationPrefForm.addEventListener("change", () => {
      setPreferencesFromInputs();
    });
  }

  const automationPreview = document.getElementById("automationPreviewNight");
  if (automationPreview) automationPreview.addEventListener("click", () => showNightOverlay("Goodnight", "Touch the screen to return to the dashboard."));
  const automationStartCalm = document.getElementById("automationStartCalm");
  if (automationStartCalm) automationStartCalm.addEventListener("click", () => applyScene("calm").then(() => showNightOverlay("Calm Scene", "Lumieres locales passees en mode soiree calme.")).catch((error) => { state.fetchError = error.message || "Scene calme indisponible."; renderFrame(); }));
  const bedroomPreview = document.getElementById("bedroomPreviewNight");
  if (bedroomPreview) bedroomPreview.addEventListener("click", () => showNightOverlay("Rest Mode", "Blackout preview active. Touchez pour revenir."));
  const bedroomStart = document.getElementById("bedroomStartProtocol");
  if (bedroomStart) bedroomStart.addEventListener("click", () => applyScene("night").then(() => showNightOverlay("Goodnight", "Sleep protocol launched. Les lumieres passent en mode nuit.")).catch((error) => { state.fetchError = error.message || "Impossible de lancer le protocole."; renderFrame(); }));
}

function startClock() {
  renderFrame();
  window.clearInterval(state.clockTimer);
  state.clockTimer = window.setInterval(() => {
    renderFrame();
  }, 60_000);
}

bindCommonEvents();
startClock();
renderPage();
const initialRssGroup = currentRssGroup();
if (initialRssGroup) {
  loadRssDigest(initialRssGroup, true)
    .catch(() => {})
    .finally(() => loadData(false).catch(() => {}));
} else {
  loadData(true).catch(() => {});
}
