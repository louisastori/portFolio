const state = {
  dashboard: null,
  fetchError: "",
  isLoading: false,
  busyLightIds: new Set(),
  refreshTimer: null,
  refreshProgressTimer: null,
  refreshStartedAt: 0,
  refreshDueAt: 0,
  refreshIntervalMs: 60_000,
  idleTimer: null,
  clockTimer: null,
  isIdle: false,
  overlayMode: "idle",
  accessibilityMode: true,
  sleepSunPlan: null,
  sleepSunPlanError: "",
  sleepSunPlanTargetDate: "",
  bedtimeVoiceReminderDate: "",
  bedtimeModeActive: false,
  bedtimeBlackoutEnabled: true,
  bedtimeReminderEnabled: true,
  bedtimeReminderLeadMinutes: 30,
  bedtimeWakeTimeoutSeconds: 45,
  ollamaMessages: [],
  ollamaIsSending: false,
  ollamaError: "",
  ollamaModel: "",
  ollamaGeneratedAt: "",
  ollamaContextLoaded: false,
  ollamaBriefText: "",
  ollamaBriefGeneratedAt: "",
  ollamaAutoBriefDone: false,
  ollamaAutoBriefPending: false,
  ollamaAlerts: [],
  ollamaSessionDate: "",
  ollamaListening: false,
  ollamaSpeaking: false,
  ollamaAutoSpeakEnabled: false,
  ollamaSpeechSupported: false,
  ollamaRecognitionSupported: false,
  ollamaRecognition: null,
  speechRate: 0.86,
  speechPitch: 1.02,
  speechPauseMs: 220,
  idleTimeoutSeconds: 90,
  lifeGoal: {
    goal: "",
    durationLabel: "",
    startDate: "",
    targetDate: "",
    why: "",
    updatedAt: "",
  },
};

const elements = {
  diagnostics: document.getElementById("diagnostics"),
  fitnessActivities: document.getElementById("fitnessActivities"),
  fitnessKpis: document.getElementById("fitnessKpis"),
  fitnessTitle: document.getElementById("fitnessTitle"),
  lifeGoalSection: document.getElementById("lifeGoalSection"),
  lifeGoalHero: document.getElementById("lifeGoalHero"),
  lifeGoalWhyDisplay: document.getElementById("lifeGoalWhyDisplay"),
  lifeGoalRoadmap: document.getElementById("lifeGoalRoadmap"),
  lifeGoalForm: document.getElementById("lifeGoalForm"),
  lifeGoalInput: document.getElementById("lifeGoalInput"),
  lifeGoalDuration: document.getElementById("lifeGoalDuration"),
  lifeGoalStartDate: document.getElementById("lifeGoalStartDate"),
  lifeGoalTargetDate: document.getElementById("lifeGoalTargetDate"),
  lifeGoalWhy: document.getElementById("lifeGoalWhy"),
  lifeGoalRoadmapInput: document.getElementById("lifeGoalRoadmapInput"),
  lifeGoalSave: document.getElementById("lifeGoalSave"),
  lifeGoalReset: document.getElementById("lifeGoalReset"),
  lightsGroups: document.getElementById("lightsGroups"),
  nutritionEntries: document.getElementById("nutritionEntries"),
  nutritionKpis: document.getElementById("nutritionKpis"),
  ollamaChatForm: document.getElementById("ollamaChatForm"),
  ollamaChatInput: document.getElementById("ollamaChatInput"),
  ollamaChatMessages: document.getElementById("ollamaChatMessages"),
  ollamaChatMeta: document.getElementById("ollamaChatMeta"),
  ollamaChatReset: document.getElementById("ollamaChatReset"),
  ollamaChatSend: document.getElementById("ollamaChatSend"),
  ollamaQuickPrompts: document.getElementById("ollamaQuickPrompts"),
  ollamaBriefCard: document.getElementById("ollamaBriefCard"),
  ollamaAlerts: document.getElementById("ollamaAlerts"),
  ollamaMemory: document.getElementById("ollamaMemory"),
  ollamaVoiceButton: document.getElementById("ollamaVoiceButton"),
  ollamaSpeakToggle: document.getElementById("ollamaSpeakToggle"),
  accessibilityToggle: document.getElementById("accessibilityToggle"),
  settingsSection: document.getElementById("settingsSection"),
  settingsSummary: document.getElementById("settingsSummary"),
  settingsAccessibility: document.getElementById("settingsAccessibility"),
  settingsAutoSpeak: document.getElementById("settingsAutoSpeak"),
  settingsSpeechRate: document.getElementById("settingsSpeechRate"),
  settingsSpeechRateValue: document.getElementById("settingsSpeechRateValue"),
  settingsSpeechPitch: document.getElementById("settingsSpeechPitch"),
  settingsSpeechPitchValue: document.getElementById("settingsSpeechPitchValue"),
  settingsSpeechPause: document.getElementById("settingsSpeechPause"),
  settingsSpeechPauseValue: document.getElementById("settingsSpeechPauseValue"),
  settingsIdleTimeout: document.getElementById("settingsIdleTimeout"),
  settingsIdleTimeoutValue: document.getElementById("settingsIdleTimeoutValue"),
  settingsBedtimeReminder: document.getElementById("settingsBedtimeReminder"),
  settingsReminderLead: document.getElementById("settingsReminderLead"),
  settingsReminderLeadValue: document.getElementById("settingsReminderLeadValue"),
  settingsBedtimeBlackout: document.getElementById("settingsBedtimeBlackout"),
  settingsWakeTimeout: document.getElementById("settingsWakeTimeout"),
  settingsWakeTimeoutValue: document.getElementById("settingsWakeTimeoutValue"),
  settingsPreviewIdle: document.getElementById("settingsPreviewIdle"),
  settingsPreviewNight: document.getElementById("settingsPreviewNight"),
  settingsReset: document.getElementById("settingsReset"),
  refreshButton: document.getElementById("refreshButton"),
  refreshMeta: document.getElementById("refreshMeta"),
  refreshProgressBar: document.getElementById("refreshProgressBar"),
  fullscreenButton: document.getElementById("fullscreenButton"),
  tabletMeta: document.getElementById("tabletMeta"),
  idleVeil: document.getElementById("idleVeil"),
  idleClock: document.getElementById("idleClock"),
  idleDate: document.getElementById("idleDate"),
  sportActivities: document.getElementById("sportActivities"),
  sportBreakdown: document.getElementById("sportBreakdown"),
  sportHeroBadges: document.getElementById("sportHeroBadges"),
  sportHeroSnapshot: document.getElementById("sportHeroSnapshot"),
  sportGeography: document.getElementById("sportGeography"),
  sportLoadHistory: document.getElementById("sportLoadHistory"),
  sportOverviewMetrics: document.getElementById("sportOverviewMetrics"),
  sportPatterns: document.getElementById("sportPatterns"),
  sportRecords: document.getElementById("sportRecords"),
  sportAiAnalysis: document.getElementById("sportAiAnalysis"),
  sportSleepStages: document.getElementById("sportSleepStages"),
  sportWellnessHistory: document.getElementById("sportWellnessHistory"),
  sportWeeklyVolume: document.getElementById("sportWeeklyVolume"),
};

const providerLabels = {
  hue: "Philips Hue",
  smartlife: "SmartLife",
  aramsmart: "AramSMART",
};

const sportTypeLabels = {
  running: "Course",
  treadmill_running: "Tapis",
  trail_running: "Trail",
  cycling: "Cyclisme",
  road_biking: "Route",
  virtual_ride: "Home trainer",
};

const sleepScoreLabels = {
  EXCELLENT: "Excellent",
  FAIR: "Correct",
  GOOD: "Bon",
  POOR: "Faible",
};

const OLLAMA_STORAGE_KEY = "projethome:ollama-chat";
const OLLAMA_PREFERENCES_KEY = "projethome:ollama-prefs";
const DISPLAY_PREFERENCES_KEY = "projethome:display-prefs";
const REST_MODE_STORAGE_KEY = "projethome:rest-mode";
const LIFE_GOAL_STORAGE_KEY = "projethome:life-goal";
const LIFE_GOAL_VERSION = "roadmap-v1";
const MAX_OLLAMA_MESSAGES = 12;
const DEFAULT_OLLAMA_GREETING =
  "Je peux commenter ta forme, ton sommeil, ta charge recente, te proposer une seance, ou repondre a une question libre.";
const AUTOMATIC_BRIEF_PROMPT =
  "Fais le brief sportif du jour en francais, en 4 phrases maximum. Parle de la forme du jour, de la charge recente, du sommeil ou de la recuperation, et termine par une action utile tres concrete pour aujourd hui.";
const SPEECH_MAX_CHUNK_LENGTH = 150;
const DEFAULT_SPEECH_RATE = 0.86;
const DEFAULT_SPEECH_PITCH = 1.02;
const SPEECH_VOLUME = 1;
const DEFAULT_SPEECH_PAUSE_MS = 220;
const SPEECH_PREFERRED_KEYWORDS = [
  "google",
  "microsoft",
  "natural",
  "neural",
  "premium",
  "online",
  "enhanced",
  "france",
  "francais",
  "français",
  "female",
  "woman",
  "femme",
  "audrey",
  "amelie",
  "amélie",
  "celine",
  "céline",
  "julie",
  "claire",
  "marie",
  "hortense",
  "denise",
];
const SPEECH_AVOID_KEYWORDS = ["eloquence", "espeak", "festival", "robot", "compact", "basic", "sapi"];
const DEFAULT_IDLE_TIMEOUT_SECONDS = 90;
const DEFAULT_BEDTIME_WAKE_TIMEOUT_SECONDS = 45;
const DEFAULT_BEDTIME_VOICE_LEAD_MINUTES = 30;
const DEFAULT_LIFE_GOAL = {
  version: LIFE_GOAL_VERSION,
  goal: "Construire une vie forte, stable et libre.",
  durationLabel: "2026 -> 2031",
  startDate: "2026-03-18",
  targetDate: "2031-03-18",
  why: "Aligner le sport, le travail, les voyages et un mode de vie plus libre sur plusieurs annees.",
  milestonesText: [
    "Nice UTMB 50 km | 2026 | objectif sport majeur",
    "Alternance | 2026 | objectif professionnel",
    "Voyage au Japon | dans 2 ans | respiration, decouverte et ouverture",
    "Nomade digitale | dans 5 ans | objectif de style de vie",
  ].join("\n"),
  updatedAt: "2026-03-18T00:00:00.000Z",
};

let speechRunId = 0;

const formatNumber = (value, maximumFractionDigits = 1) => {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return Number.isInteger(value)
    ? value.toLocaleString("fr-FR")
    : value.toLocaleString("fr-FR", { maximumFractionDigits });
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value || 0)));

const formatDate = (value) => {
  if (!value) {
    return "n/a";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "n/a";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(date);
};

const formatLongDate = (value) => {
  if (!value) {
    return "--";
  }

  const iso = value.indexOf("T") >= 0 ? value : `${value}T12:00:00`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const isoDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const escapeHtml = (value) =>
  String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const clampNumber = (value, fallback, min, max) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
};

const normalizeIsoDateValue = (value) => {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
};

const sanitizeLifeGoal = (payload) => {
  const source = payload && typeof payload === "object" ? payload : {};
  return {
    version: String(source.version || "").trim(),
    goal: String(source.goal || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200),
    durationLabel: String(source.durationLabel || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80),
    startDate: normalizeIsoDateValue(source.startDate),
    targetDate: normalizeIsoDateValue(source.targetDate),
    why: String(source.why || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 320),
    milestonesText: String(source.milestonesText || "")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 10)
      .join("\n"),
    updatedAt: String(source.updatedAt || "").trim(),
  };
};

const hasMeaningfulLifeGoal = (goal) =>
  Boolean(goal && (goal.goal || goal.durationLabel || goal.targetDate || goal.why || goal.milestonesText));

const parseLifeGoalMilestones = (value) =>
  String(value || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [titlePart, horizonPart, notePart] = line.split("|").map((part) => String(part || "").trim());
      return {
        title: titlePart || line,
        horizon: horizonPart || "Horizon libre",
        note: notePart || "",
      };
    })
    .filter((item) => item.title)
    .slice(0, 10);

const sanitizeOllamaMessages = (messages) =>
  Array.isArray(messages)
    ? messages
        .map((message) => {
          const role =
            message && message.role === "assistant"
              ? "assistant"
              : message && message.role === "user"
                ? "user"
                : "";
          const content = String((message && message.content) || "")
            .trim()
            .slice(0, 2000);

          if (!role || !content) {
            return null;
          }

          return { role, content };
        })
        .filter(Boolean)
        .slice(-MAX_OLLAMA_MESSAGES)
    : [];

const todayKey = () => {
  const now = new Date();
  return isoDateKey(now);
};

const truncateText = (value, maxLength = 140) => {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  if (!text) {
    return "";
  }

  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...` : text;
};

const getLastMessageByRole = (role) => {
  for (let index = state.ollamaMessages.length - 1; index >= 0; index -= 1) {
    if (state.ollamaMessages[index] && state.ollamaMessages[index].role === role) {
      return state.ollamaMessages[index];
    }
  }
  return null;
};

const loadStoredOllamaSession = () => {
  const currentDay = todayKey();

  try {
    const payload = JSON.parse(window.localStorage.getItem(OLLAMA_STORAGE_KEY) || "null");

    if (Array.isArray(payload)) {
      return {
        date: currentDay,
        messages: sanitizeOllamaMessages(payload),
        briefText: "",
        briefGeneratedAt: "",
        autoBriefDone: false,
      };
    }

    if (!payload || typeof payload !== "object" || payload.date !== currentDay) {
      return {
        date: currentDay,
        messages: [],
        briefText: "",
        briefGeneratedAt: "",
        autoBriefDone: false,
      };
    }

    return {
      date: currentDay,
      messages: sanitizeOllamaMessages(payload.messages),
      briefText: String(payload.briefText || "").trim(),
      briefGeneratedAt: String(payload.briefGeneratedAt || "").trim(),
      autoBriefDone: Boolean(payload.autoBriefDone),
    };
  } catch (_error) {
    return {
      date: currentDay,
      messages: [],
      briefText: "",
      briefGeneratedAt: "",
      autoBriefDone: false,
    };
  }
};

const loadOllamaPreferences = () => {
  try {
    const payload = JSON.parse(window.localStorage.getItem(OLLAMA_PREFERENCES_KEY) || "null");
    return {
      autoSpeakEnabled: Boolean(payload && payload.autoSpeakEnabled),
      speechRate: clampNumber(payload && payload.speechRate, DEFAULT_SPEECH_RATE, 0.75, 1.1),
      speechPitch: clampNumber(payload && payload.speechPitch, DEFAULT_SPEECH_PITCH, 0.85, 1.2),
      speechPauseMs: clampNumber(payload && payload.speechPauseMs, DEFAULT_SPEECH_PAUSE_MS, 80, 600),
    };
  } catch (_error) {
    return {
      autoSpeakEnabled: false,
      speechRate: DEFAULT_SPEECH_RATE,
      speechPitch: DEFAULT_SPEECH_PITCH,
      speechPauseMs: DEFAULT_SPEECH_PAUSE_MS,
    };
  }
};

const loadDisplayPreferences = () => {
  try {
    const payload = JSON.parse(window.localStorage.getItem(DISPLAY_PREFERENCES_KEY) || "null");
    return {
      accessibilityMode:
        payload && typeof payload.accessibilityMode === "boolean" ? payload.accessibilityMode : true,
      idleTimeoutSeconds: clampNumber(
        payload && payload.idleTimeoutSeconds,
        DEFAULT_IDLE_TIMEOUT_SECONDS,
        30,
        600
      ),
    };
  } catch (_error) {
    return {
      accessibilityMode: true,
      idleTimeoutSeconds: DEFAULT_IDLE_TIMEOUT_SECONDS,
    };
  }
};

const loadRestModePreferences = () => {
  try {
    const payload = JSON.parse(window.localStorage.getItem(REST_MODE_STORAGE_KEY) || "null");
    return {
      bedtimeVoiceReminderDate: String((payload && payload.bedtimeVoiceReminderDate) || "").trim(),
      bedtimeBlackoutEnabled:
        payload && typeof payload.bedtimeBlackoutEnabled === "boolean" ? payload.bedtimeBlackoutEnabled : true,
      bedtimeReminderEnabled:
        payload && typeof payload.bedtimeReminderEnabled === "boolean" ? payload.bedtimeReminderEnabled : true,
      bedtimeReminderLeadMinutes: clampNumber(
        payload && payload.bedtimeReminderLeadMinutes,
        DEFAULT_BEDTIME_VOICE_LEAD_MINUTES,
        5,
        120
      ),
      bedtimeWakeTimeoutSeconds: clampNumber(
        payload && payload.bedtimeWakeTimeoutSeconds,
        DEFAULT_BEDTIME_WAKE_TIMEOUT_SECONDS,
        10,
        300
      ),
    };
  } catch (_error) {
    return {
      bedtimeVoiceReminderDate: "",
      bedtimeBlackoutEnabled: true,
      bedtimeReminderEnabled: true,
      bedtimeReminderLeadMinutes: DEFAULT_BEDTIME_VOICE_LEAD_MINUTES,
      bedtimeWakeTimeoutSeconds: DEFAULT_BEDTIME_WAKE_TIMEOUT_SECONDS,
    };
  }
};

const loadStoredLifeGoal = () => {
  try {
    const goal = sanitizeLifeGoal(JSON.parse(window.localStorage.getItem(LIFE_GOAL_STORAGE_KEY) || "null"));
    if (goal.version !== LIFE_GOAL_VERSION || !goal.milestonesText) {
      return sanitizeLifeGoal(DEFAULT_LIFE_GOAL);
    }
    return hasMeaningfulLifeGoal(goal) ? goal : sanitizeLifeGoal(DEFAULT_LIFE_GOAL);
  } catch (_error) {
    return sanitizeLifeGoal(DEFAULT_LIFE_GOAL);
  }
};

const persistOllamaSession = () => {
  try {
    window.localStorage.setItem(
      OLLAMA_STORAGE_KEY,
      JSON.stringify({
        date: state.ollamaSessionDate,
        messages: state.ollamaMessages,
        briefText: state.ollamaBriefText,
        briefGeneratedAt: state.ollamaBriefGeneratedAt,
        autoBriefDone: state.ollamaAutoBriefDone,
      })
    );
  } catch (_error) {
    // Ignore storage failures on locked-down tablets.
  }
};

const persistDisplayPreferences = () => {
  try {
    window.localStorage.setItem(
      DISPLAY_PREFERENCES_KEY,
      JSON.stringify({
        accessibilityMode: state.accessibilityMode,
        idleTimeoutSeconds: state.idleTimeoutSeconds,
      })
    );
  } catch (_error) {
    // Ignore storage failures on locked-down tablets.
  }
};

const persistRestModePreferences = () => {
  try {
    window.localStorage.setItem(
      REST_MODE_STORAGE_KEY,
      JSON.stringify({
        bedtimeVoiceReminderDate: state.bedtimeVoiceReminderDate,
        bedtimeBlackoutEnabled: state.bedtimeBlackoutEnabled,
        bedtimeReminderEnabled: state.bedtimeReminderEnabled,
        bedtimeReminderLeadMinutes: state.bedtimeReminderLeadMinutes,
        bedtimeWakeTimeoutSeconds: state.bedtimeWakeTimeoutSeconds,
      })
    );
  } catch (_error) {
    // Ignore storage failures on locked-down tablets.
  }
};

const persistOllamaPreferences = () => {
  try {
    window.localStorage.setItem(
      OLLAMA_PREFERENCES_KEY,
      JSON.stringify({
        autoSpeakEnabled: state.ollamaAutoSpeakEnabled,
        speechRate: state.speechRate,
        speechPitch: state.speechPitch,
        speechPauseMs: state.speechPauseMs,
      })
    );
  } catch (_error) {
    // Ignore storage failures on locked-down tablets.
  }
};

const persistLifeGoal = () => {
  try {
    window.localStorage.setItem(LIFE_GOAL_STORAGE_KEY, JSON.stringify(state.lifeGoal));
  } catch (_error) {
    // Ignore storage failures on locked-down tablets.
  }
};

const clock = (seconds) => {
  if (seconds === null || seconds === undefined) {
    return "--";
  }

  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remain = total % 60;

  if (hours) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remain).padStart(2, "0")}`;
};

const minutesLabel = (minutes) => {
  const safe = Math.round(minutes || 0);
  const whole = Math.floor(safe / 60);
  const remain = safe % 60;
  return whole ? `${whole} h ${String(remain).padStart(2, "0")}` : `${remain} min`;
};

const pace = (secondsPerKm) => (secondsPerKm ? `${clock(secondsPerKm)} /km` : "--");

const effect = (value) =>
  value
    ? String(value)
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "Seance";

const activityTypeLabel = (value) => sportTypeLabels[value] || value || "Activite";

const activityMetric = (activity) => {
  const typeKey = String(activity.typeKey || "");
  if (typeKey.indexOf("cycl") >= 0 || typeKey.indexOf("bike") >= 0 || typeKey.indexOf("ride") >= 0) {
    const speed = activity.durationHours ? activity.distanceKm / activity.durationHours : 0;
    return `${formatNumber(speed)} km/h`;
  }
  return pace(activity.paceSecPerKm);
};

const normalizeColorHex = (value, fallback) => {
  if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim())) {
    return value.trim().toLowerCase();
  }
  return fallback;
};

const normalizedLightName = (light) => String((light && light.name) || "").trim();

const normalizedLightKey = (light) => normalizedLightName(light).toLowerCase();

const isHiddenLight = (light) => normalizedLightKey(light) === "en bas";

const isLouisPairLight = (light) => {
  const key = normalizedLightKey(light);
  return key === "gauche louis" || key === "droite louis";
};

const parseLightIds = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

{
  const session = loadStoredOllamaSession();
  const preferences = loadOllamaPreferences();
  const displayPreferences = loadDisplayPreferences();
  const restModePreferences = loadRestModePreferences();
  const lifeGoal = loadStoredLifeGoal();

  state.ollamaSessionDate = session.date;
  state.ollamaMessages = session.messages;
  state.ollamaBriefText = session.briefText;
  state.ollamaBriefGeneratedAt = session.briefGeneratedAt;
  state.ollamaAutoBriefDone = session.autoBriefDone;
  state.ollamaAutoSpeakEnabled = preferences.autoSpeakEnabled;
  state.speechRate = preferences.speechRate;
  state.speechPitch = preferences.speechPitch;
  state.speechPauseMs = preferences.speechPauseMs;
  state.accessibilityMode = displayPreferences.accessibilityMode;
  state.idleTimeoutSeconds = displayPreferences.idleTimeoutSeconds;
  state.bedtimeVoiceReminderDate = restModePreferences.bedtimeVoiceReminderDate;
  state.bedtimeBlackoutEnabled = restModePreferences.bedtimeBlackoutEnabled;
  state.bedtimeReminderEnabled = restModePreferences.bedtimeReminderEnabled;
  state.bedtimeReminderLeadMinutes = restModePreferences.bedtimeReminderLeadMinutes;
  state.bedtimeWakeTimeoutSeconds = restModePreferences.bedtimeWakeTimeoutSeconds;
  state.lifeGoal = lifeGoal;
  persistLifeGoal();
}

const buildLouisPairCard = (provider, lights) => {
  const pairLights = lights
    .filter(isLouisPairLight)
    .sort((left, right) => normalizedLightKey(left).localeCompare(normalizedLightKey(right), "fr"));

  if (pairLights.length < 2) {
    return "";
  }

  const groupUiId = `${provider}:louis-pair`;
  const busy =
    state.busyLightIds.has(groupUiId) || pairLights.some((light) => state.busyLightIds.has(light.id));
  const allOn = pairLights.every((light) => light.isOn);
  const onCount = pairLights.filter((light) => light.isOn).length;
  const nextOn = !allOn;
  const pairBrightness = Math.round(
    pairLights.reduce((total, light) => total + Number(light.brightness || 0), 0) / pairLights.length
  );
  const supportsPairColor = pairLights.every((light) => light.supportsColor);
  const distinctColors = [...new Set(pairLights.map((light) => normalizeColorHex(light.colorHex, "#ffffff")))];
  const pairColor = distinctColors[0] || "#ffffff";
  const pairSynchronized = pairLights.every(
    (light) =>
      Number(light.brightness || 0) === Number(pairLights[0].brightness || 0) &&
      normalizeColorHex(light.colorHex, "#ffffff") === normalizeColorHex(pairLights[0].colorHex, "#ffffff") &&
      Boolean(light.isOn) === Boolean(pairLights[0].isOn)
  );
  const subtitle =
    onCount === 0
      ? "Etat: eteintes"
      : onCount === pairLights.length
        ? "Etat: allumees"
        : `Etat: ${onCount}/${pairLights.length} allumees`;

  return `
    <article class="light-card light-card-group">
      <div class="light-head">
        <div>
          <p class="light-name">Louis gauche + droite</p>
          <p class="light-subtitle">${escapeHtml(subtitle)}${pairSynchronized ? " - sync" : " - non sync"}</p>
        </div>
        <button
          class="light-button ${nextOn ? "off" : ""}"
          data-action="toggle-group"
          data-provider="${escapeHtml(provider)}"
          data-light-ids="${escapeHtml(pairLights.map((light) => light.providerLightId).join(","))}"
          data-ui-id="${escapeHtml(groupUiId)}"
          data-next-on="${String(nextOn)}"
          ${busy ? "disabled" : ""}
          type="button"
        >
          ${busy ? "..." : allOn ? "Eteindre les deux" : "Allumer les deux"}
        </button>
      </div>
      <p class="light-group-note">Une seule commande pour garder la meme intensite et la meme couleur.</p>
      <div class="light-controls light-controls-group">
        <input
          class="slider"
          data-action="brightness-group"
          data-provider="${escapeHtml(provider)}"
          data-light-ids="${escapeHtml(pairLights.map((light) => light.providerLightId).join(","))}"
          data-ui-id="${escapeHtml(groupUiId)}"
          type="range"
          min="0"
          max="100"
          value="${escapeHtml(String(pairBrightness))}"
          ${busy ? "disabled" : ""}
        />
        <span class="light-level" data-role="brightness-value" data-ui-id="${escapeHtml(groupUiId)}">${escapeHtml(String(pairBrightness))}%</span>
      </div>
      ${
        supportsPairColor
          ? `
              <div class="light-color-row">
                <label class="light-color-label" for="color-${escapeHtml(groupUiId)}">Couleur commune</label>
                <div class="light-color-actions">
                  <input
                    id="color-${escapeHtml(groupUiId)}"
                    class="light-color-input"
                    data-action="color-group"
                    data-provider="${escapeHtml(provider)}"
                    data-light-ids="${escapeHtml(pairLights.map((light) => light.providerLightId).join(","))}"
                    data-ui-id="${escapeHtml(groupUiId)}"
                    type="color"
                    value="${escapeHtml(pairColor)}"
                    ${busy ? "disabled" : ""}
                  />
                  <span class="light-color-value">${escapeHtml(pairColor)}</span>
                </div>
              </div>
            `
          : ""
      }
    </article>
  `;
};

const findActionTarget = (startNode, actionName) => {
  let current = startNode;

  while (current && current !== elements.lightsGroups) {
    if (current.dataset && current.dataset.action === actionName) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
};

const themeMode = () => {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 18 ? "day" : "night";
};

const applyAccessibilityFolds = () => {
  document.querySelectorAll("[data-accessibility-fold]").forEach((fold) => {
    fold.open = !state.accessibilityMode;
  });
};

const renderAccessibilityMode = () => {
  document.body.classList.toggle("accessible-mode", state.accessibilityMode);
  document.body.dataset.readabilityMode = state.accessibilityMode ? "focus" : "full";
  elements.accessibilityToggle.textContent = state.accessibilityMode ? "Vue detaillee" : "Mode lisible";
  applyAccessibilityFolds();
};

const renderTabletMeta = () => {
  const mode = document.body.dataset.surfaceMode === "day" ? "jour" : "nuit";
  const fullscreen = document.fullscreenElement ? "plein ecran" : "fenetre";
  const readability = state.accessibilityMode ? "lisible" : "detaillee";
  const bedtimeLabel =
    state.sleepSunPlan && state.sleepSunPlan.bedtimeForSunrise
      ? ` - coucher cible ${state.sleepSunPlan.bedtimeForSunrise.label}`
      : "";
  const nightState = state.bedtimeModeActive ? " - veille noire active" : "";
  elements.tabletMeta.textContent = `Theme auto: ${mode} - ${fullscreen} - vue ${readability}${bedtimeLabel}${nightState} - refresh ${Math.round(
    (state.refreshIntervalMs || 60_000) / 1000
  )} s`;
  elements.fullscreenButton.textContent = document.fullscreenElement ? "Quitter plein ecran" : "Plein ecran";
};

const updateSurfaceMode = () => {
  document.body.dataset.surfaceMode = themeMode();
  renderTabletMeta();
};

const renderClock = () => {
  const now = new Date();
  elements.idleClock.textContent = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  elements.idleDate.textContent = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
};

const renderOverlayMode = () => {
  document.body.classList.toggle("bedtime-blackout", state.overlayMode === "bedtime");
};

const enterOverlay = (mode) => {
  state.isIdle = true;
  state.overlayMode = mode;
  elements.idleVeil.hidden = false;
  document.body.classList.add("is-idle");
  renderOverlayMode();
};

const enterIdle = () => {
  enterOverlay(state.bedtimeModeActive ? "bedtime" : "idle");
};

const enterBedtimeBlackout = () => {
  enterOverlay("bedtime");
};

const wakeInterface = () => {
  state.isIdle = false;
  state.overlayMode = "idle";
  elements.idleVeil.hidden = true;
  document.body.classList.remove("is-idle");
  renderOverlayMode();
};

const armIdleTimer = () => {
  window.clearTimeout(state.idleTimer);
  if (state.isIdle) {
    wakeInterface();
  }

  state.idleTimer = window.setTimeout(() => {
    if (state.bedtimeModeActive) {
      enterBedtimeBlackout();
      return;
    }

    enterIdle();
  }, (state.bedtimeModeActive ? state.bedtimeWakeTimeoutSeconds : state.idleTimeoutSeconds) * 1000);
};

const updateRefreshProgress = () => {
  if (!state.refreshDueAt || state.isLoading) {
    elements.refreshProgressBar.style.width = "0%";
    return;
  }

  const total = Math.max(state.refreshDueAt - state.refreshStartedAt, 1);
  const elapsed = clamp(Date.now() - state.refreshStartedAt, 0, total);
  const progress = Math.round((elapsed / total) * 100);
  elements.refreshProgressBar.style.width = `${progress}%`;
};

const scheduleRefresh = (intervalMs) => {
  window.clearTimeout(state.refreshTimer);
  window.clearInterval(state.refreshProgressTimer);
  state.refreshIntervalMs = Math.max(10_000, intervalMs || 60_000);
  state.refreshStartedAt = Date.now();
  state.refreshDueAt = state.refreshStartedAt + state.refreshIntervalMs;
  updateRefreshProgress();
  state.refreshProgressTimer = window.setInterval(updateRefreshProgress, 1000);
  state.refreshTimer = window.setTimeout(() => {
    loadDashboard(false);
  }, state.refreshIntervalMs);
};

const renderRefreshMeta = () => {
  elements.refreshButton.disabled = state.isLoading;
  elements.refreshButton.textContent = state.isLoading ? "Chargement..." : "Refresh live";

  if (state.dashboard) {
    elements.refreshMeta.textContent = `Derniere sync: ${formatDate(state.dashboard.generatedAt)}`;
    updateRefreshProgress();
    renderTabletMeta();
    return;
  }

  elements.refreshMeta.textContent = state.fetchError ? `Erreur: ${state.fetchError}` : "Derniere sync: n/a";
  updateRefreshProgress();
  renderTabletMeta();
};

const toggleFullscreen = async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }

  await document.documentElement.requestFullscreen();
};

const sportMetricCard = (label, value, note) => `
  <article class="sport-metric-card">
    <p class="sport-soft-label">${escapeHtml(label)}</p>
    <span class="sport-metric-value">${escapeHtml(value)}</span>
    <p class="sport-metric-note">${escapeHtml(note)}</p>
  </article>
`;

const renderSport = () => {
  if (window.SportDashboard && typeof window.SportDashboard.render === "function") {
    window.SportDashboard.render({
      sport: state.dashboard && state.dashboard.sport,
      elements,
    });
    return;
  }

  elements.sportHeroBadges.innerHTML = '<span class="sport-pill">Vue sport indisponible</span>';
  elements.sportHeroSnapshot.innerHTML = `
    <div class="sport-soft-card">
      <p class="sport-soft-label">Sport</p>
      <p class="sport-soft-value">Le module de rendu sport n est pas charge.</p>
    </div>
  `;
  elements.sportOverviewMetrics.innerHTML = sportMetricCard("Sport", "--", "Le fichier /sport.js est introuvable.");
  [
    elements.sportWeeklyVolume,
    elements.sportLoadHistory,
    elements.sportGeography,
    elements.sportBreakdown,
    elements.sportWellnessHistory,
    elements.sportSleepStages,
    elements.sportPatterns,
    elements.sportRecords,
    elements.sportAiAnalysis,
  ].forEach((node) => {
    if (node) {
      node.innerHTML = '<p class="sport-soft-label">Module sport indisponible.</p>';
    }
  });
  elements.sportActivities.innerHTML = '<article class="sport-soft-card"><p class="sport-soft-label">Aucune activite recente disponible.</p></article>';
};

const renderFitness = () => {
  const fitness = state.dashboard && state.dashboard.fitness;

  if (!fitness) {
    elements.fitnessTitle.textContent = "Service non disponible";
    elements.fitnessKpis.innerHTML = '<p class="empty-state">Aucune donnee fitness disponible.</p>';
    elements.fitnessActivities.innerHTML = "";
    return;
  }

  elements.fitnessTitle.textContent = `${fitness.athleteName}${fitness.city ? ` - ${fitness.city}` : ""}`;
  elements.fitnessKpis.innerHTML = fitness.kpis
    .map(
      (kpi) => `
        <article class="kpi-card">
          <span class="kpi-label">${escapeHtml(kpi.label)}</span>
          <span class="kpi-value">${escapeHtml(formatNumber(kpi.value))} <span class="kpi-unit">${escapeHtml(kpi.unit)}</span></span>
        </article>
      `
    )
    .join("");

  if (!fitness.activities.length) {
    elements.fitnessActivities.innerHTML = '<p class="empty-state">Aucune activite recente.</p>';
    return;
  }

  elements.fitnessActivities.innerHTML = fitness.activities
    .map(
      (activity) => `
        <article class="list-item">
          <div>
            <p class="item-title">${escapeHtml(activity.name)}</p>
            <p class="item-meta">${escapeHtml(activity.source.toUpperCase())} - ${escapeHtml(activity.type)} - ${escapeHtml(formatDate(activity.date))}</p>
          </div>
          <div class="item-value">${escapeHtml(formatNumber(activity.distanceKm))} km</div>
        </article>
      `
    )
    .join("");
};

const renderNutrition = () => {
  const nutrition = state.dashboard && state.dashboard.nutrition;

  if (!nutrition) {
    elements.nutritionKpis.innerHTML = '<p class="empty-state">Aucune donnee nutrition disponible.</p>';
    elements.nutritionEntries.innerHTML = "";
    return;
  }

  const cards = [
    ["Calories today", nutrition.totalToday, "kcal"],
    ["Calories 7 days", nutrition.totalWeek, "kcal"],
    ["Meals logged", nutrition.count, "entries"],
    ["Average meal", nutrition.averageMeal, "kcal"],
  ];

  elements.nutritionKpis.innerHTML = cards
    .map(
      ([label, value, unit]) => `
        <article class="kpi-card">
          <span class="kpi-label">${escapeHtml(label)}</span>
          <span class="kpi-value">${escapeHtml(formatNumber(Number(value)))} <span class="kpi-unit">${escapeHtml(unit)}</span></span>
        </article>
      `
    )
    .join("");

  if (!nutrition.entries.length) {
    elements.nutritionEntries.innerHTML = '<p class="empty-state">Aucune entree nutrition recente.</p>';
    return;
  }

  elements.nutritionEntries.innerHTML = nutrition.entries
    .map(
      (entry) => `
        <article class="list-item">
          <div>
            <p class="item-title">${escapeHtml(entry.name)}</p>
            <p class="item-meta">${escapeHtml(formatNumber(entry.grams, 0))} g - ${escapeHtml(formatDate(entry.capturedAt))}</p>
          </div>
          <div class="item-value">${escapeHtml(formatNumber(entry.calories, 0))} kcal</div>
        </article>
      `
    )
    .join("");
};

const renderLights = () => {
  const lights = (state.dashboard && state.dashboard.lights) || [];

  if (!lights.length) {
    elements.lightsGroups.innerHTML = '<p class="empty-state">Aucune lumiere detectee. Verifie la configuration serveur.</p>';
    return;
  }

  const groups = Object.keys(providerLabels)
    .map((provider) => {
      const providerLights = lights.filter((light) => light.provider === provider);

      if (!providerLights.length) {
        return "";
      }

      const visibleLights = providerLights.filter((light) => !isHiddenLight(light));
      const groupCard = buildLouisPairCard(provider, visibleLights);
      const cards = visibleLights
        .map((light) => {
          const busy = state.busyLightIds.has(light.id);
          const colorHex = normalizeColorHex(light.colorHex, "#ffffff");
          const displayName = normalizedLightName(light) || light.name;
          const colorControl = light.supportsColor
            ? `
                <div class="light-color-row">
                  <label class="light-color-label" for="color-${escapeHtml(light.id)}">Couleur</label>
                  <div class="light-color-actions">
                    <input
                      id="color-${escapeHtml(light.id)}"
                      class="light-color-input"
                      data-action="color"
                      data-provider="${escapeHtml(light.provider)}"
                      data-light-id="${escapeHtml(light.providerLightId)}"
                      data-ui-id="${escapeHtml(light.id)}"
                      type="color"
                      value="${escapeHtml(colorHex)}"
                      ${busy ? "disabled" : ""}
                    />
                    <span class="light-color-value">${escapeHtml(colorHex)}</span>
                  </div>
                </div>
              `
            : "";

          return `
            <article class="light-card">
              <div class="light-head">
                <div>
                  <p class="light-name">${escapeHtml(displayName)}</p>
                  <p class="light-subtitle">Etat: ${light.isOn ? "allumee" : "eteinte"}</p>
                </div>
                <button
                  class="light-button ${light.isOn ? "" : "off"}"
                  data-action="toggle"
                  data-provider="${escapeHtml(light.provider)}"
                  data-light-id="${escapeHtml(light.providerLightId)}"
                  data-next-on="${String(!light.isOn)}"
                  ${busy ? "disabled" : ""}
                  type="button"
                >
                  ${busy ? "..." : light.isOn ? "Eteindre" : "Allumer"}
                </button>
              </div>
              <div class="light-controls">
                <input
                  class="slider"
                  data-action="brightness"
                  data-provider="${escapeHtml(light.provider)}"
                  data-light-id="${escapeHtml(light.providerLightId)}"
                  data-ui-id="${escapeHtml(light.id)}"
                  type="range"
                  min="0"
                  max="100"
                  value="${escapeHtml(String(light.brightness))}"
                  ${busy ? "disabled" : ""}
                />
                <span class="light-level" data-role="brightness-value" data-ui-id="${escapeHtml(light.id)}">${escapeHtml(String(light.brightness))}%</span>
              </div>
              ${colorControl}
            </article>
          `;
        })
        .join("");

      if (!groupCard && !cards) {
        return "";
      }

      return `
        <section class="light-group">
          <h3 class="group-title">${escapeHtml(providerLabels[provider])}</h3>
          ${groupCard}
          ${cards}
        </section>
      `;
    })
    .filter(Boolean)
    .join("");

  elements.lightsGroups.innerHTML = groups || '<p class="empty-state">Aucun groupe de lumieres configure.</p>';
};

const renderDiagnostics = () => {
  const warnings = (state.dashboard && state.dashboard.warnings ? state.dashboard.warnings.slice() : []);
  if (state.fetchError) {
    warnings.unshift({
      scope: "hub",
      message: state.fetchError,
    });
  }

  if (!warnings.length) {
    elements.diagnostics.innerHTML = `
      <article class="status-card ok">
        <p class="status-title">Tout repond</p>
        <p class="status-text">Le serveur local est joignable et aucun warning n est remonte.</p>
      </article>
    `;
    return;
  }

  elements.diagnostics.innerHTML = warnings
    .map(
      (warning) => `
        <article class="status-card warn">
          <p class="status-title">${escapeHtml(String(warning.scope || "hub")).toUpperCase()}</p>
          <p class="status-text">${escapeHtml(warning.message || "Erreur inconnue.")}</p>
        </article>
      `
    )
    .join("");
};

const renderSettings = () => {
  if (!elements.settingsSection) {
    return;
  }

  const schedule = getSleepSunSchedule(state.sleepSunPlan);
  const bedtimeLabel = state.sleepSunPlan?.bedtimeForSunrise?.label || "--:--";
  const sunriseLabel = state.sleepSunPlan?.sunrise?.label || "--:--";
  const reminderLabel = schedule
    ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(schedule.bedtimeReminderDate)
    : "--:--";
  const summary = state.sleepSunPlan
    ? `Coucher cible ${bedtimeLabel}, rappel ${state.bedtimeReminderEnabled ? reminderLabel : "off"}, soleil ${sunriseLabel}.`
    : state.sleepSunPlanError
      ? `Plan sommeil indisponible: ${state.sleepSunPlanError}`
      : "Le plan coucher / soleil se charge.";

  elements.settingsSummary.textContent = summary;
  elements.settingsAccessibility.checked = state.accessibilityMode;
  elements.settingsAutoSpeak.checked = state.ollamaAutoSpeakEnabled;
  elements.settingsSpeechRate.value = String(state.speechRate);
  elements.settingsSpeechRateValue.textContent = `${state.speechRate.toFixed(2)}x`;
  elements.settingsSpeechPitch.value = String(state.speechPitch);
  elements.settingsSpeechPitchValue.textContent = `${state.speechPitch.toFixed(2)}`;
  elements.settingsSpeechPause.value = String(state.speechPauseMs);
  elements.settingsSpeechPauseValue.textContent = `${Math.round(state.speechPauseMs)} ms`;
  elements.settingsIdleTimeout.value = String(state.idleTimeoutSeconds);
  elements.settingsIdleTimeoutValue.textContent = `${Math.round(state.idleTimeoutSeconds)} s`;
  elements.settingsBedtimeReminder.checked = state.bedtimeReminderEnabled;
  elements.settingsReminderLead.value = String(state.bedtimeReminderLeadMinutes);
  elements.settingsReminderLeadValue.textContent = `${Math.round(state.bedtimeReminderLeadMinutes)} min`;
  elements.settingsBedtimeBlackout.checked = state.bedtimeBlackoutEnabled;
  elements.settingsWakeTimeout.value = String(state.bedtimeWakeTimeoutSeconds);
  elements.settingsWakeTimeoutValue.textContent = `${Math.round(state.bedtimeWakeTimeoutSeconds)} s`;
  elements.settingsAutoSpeak.disabled = !state.ollamaSpeechSupported;
  elements.settingsSpeechRate.disabled = !state.ollamaSpeechSupported;
  elements.settingsSpeechPitch.disabled = !state.ollamaSpeechSupported;
  elements.settingsSpeechPause.disabled = !state.ollamaSpeechSupported;
  elements.settingsReminderLead.disabled = !state.bedtimeReminderEnabled;
  elements.settingsWakeTimeout.disabled = !state.bedtimeBlackoutEnabled;
};

const resetSettings = () => {
  state.accessibilityMode = true;
  state.idleTimeoutSeconds = DEFAULT_IDLE_TIMEOUT_SECONDS;
  state.ollamaAutoSpeakEnabled = false;
  state.speechRate = DEFAULT_SPEECH_RATE;
  state.speechPitch = DEFAULT_SPEECH_PITCH;
  state.speechPauseMs = DEFAULT_SPEECH_PAUSE_MS;
  state.bedtimeReminderEnabled = true;
  state.bedtimeReminderLeadMinutes = DEFAULT_BEDTIME_VOICE_LEAD_MINUTES;
  state.bedtimeBlackoutEnabled = true;
  state.bedtimeWakeTimeoutSeconds = DEFAULT_BEDTIME_WAKE_TIMEOUT_SECONDS;
  state.bedtimeVoiceReminderDate = "";
  persistDisplayPreferences();
  persistOllamaPreferences();
  persistRestModePreferences();
  stopSpeaking();
  renderAccessibilityMode();
  refreshRestModeState();
  renderTabletMeta();
  renderSettings();
  renderOllamaChat();
  armIdleTimer();
};

const parseDateKey = (value) => {
  const iso = normalizeIsoDateValue(value);
  if (!iso) {
    return null;
  }

  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

const renderLifeGoal = () => {
  if (!elements.lifeGoalSection) {
    return;
  }

  const titleElement = elements.lifeGoalHero.querySelector(".life-goal-title");
  const copyElement = elements.lifeGoalHero.querySelector(".life-goal-copy");
  const goal = sanitizeLifeGoal(state.lifeGoal);
  const milestones = parseLifeGoalMilestones(goal.milestonesText);
  const startDate = parseDateKey(goal.startDate);
  const targetDate = parseDateKey(goal.targetDate);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const totalDays =
    startDate && targetDate && targetDate >= startDate
      ? Math.max(1, Math.round((targetDate.getTime() - startDate.getTime()) / 86_400_000))
      : 0;
  const remainingDays = targetDate ? Math.ceil((targetDate.getTime() - today.getTime()) / 86_400_000) : null;
  const elapsedDays = totalDays ? clamp((today.getTime() - startDate.getTime()) / 86_400_000, 0, totalDays) : 0;
  const progressPercent = totalDays ? Math.round((elapsedDays / totalDays) * 100) : 0;

  let durationDisplay = goal.durationLabel || "A definir";
  if (!goal.durationLabel && totalDays) {
    durationDisplay = `${totalDays} jour${totalDays > 1 ? "s" : ""}`;
  }

  let remainingDisplay = "A definir";
  if (remainingDays !== null) {
    if (remainingDays > 0) {
      remainingDisplay = `${remainingDays} jour${remainingDays > 1 ? "s" : ""}`;
    } else if (remainingDays === 0) {
      remainingDisplay = "Aujourd hui";
    } else {
      const lateDays = Math.abs(remainingDays);
      remainingDisplay = `${lateDays} jour${lateDays > 1 ? "s" : ""} depasse${lateDays > 1 ? "s" : ""}`;
    }
  }

  let progressLabel = "Progression temporelle non disponible.";
  if (totalDays) {
    progressLabel = `${progressPercent}% du temps`;
  } else if (targetDate) {
    progressLabel = "Suivi debut manquant";
  } else {
    progressLabel = "Sans suivi date";
  }

  if (milestones.length) {
    progressLabel = `${milestones.length} cap${milestones.length > 1 ? "s" : ""} · ${progressLabel}`;
  }

  progressLabel = progressLabel.replace(/\s+[^\w\s%]+\s+/g, " - ");
  titleElement.textContent = goal.goal || "Aucun objectif defini";
  copyElement.textContent = goal.durationLabel || (milestones.length ? `${milestones.length} caps actifs` : "");
  elements.lifeGoalWhyDisplay.textContent = "";
  elements.lifeGoalRoadmap.innerHTML = milestones.length
    ? milestones
        .map(
          (item) => `
            <article class="life-goal-roadmap-card">
              <p class="life-goal-roadmap-horizon">${escapeHtml(item.horizon)}</p>
              <p class="life-goal-roadmap-title">${escapeHtml(item.title)}</p>
            </article>
          `
        )
        .join("")
    : `
        <article class="life-goal-roadmap-card">
          <p class="life-goal-roadmap-horizon">Horizon</p>
          <p class="life-goal-roadmap-title">Aucun jalon defini</p>
        </article>
      `;
  elements.lifeGoalInput.value = goal.goal;
  elements.lifeGoalDuration.value = goal.durationLabel;
  elements.lifeGoalStartDate.value = goal.startDate;
  elements.lifeGoalTargetDate.value = goal.targetDate;
  elements.lifeGoalWhy.value = goal.why;
  elements.lifeGoalRoadmapInput.value = goal.milestonesText;
};

const saveLifeGoal = () => {
  state.lifeGoal = sanitizeLifeGoal({
    version: LIFE_GOAL_VERSION,
    goal: elements.lifeGoalInput.value,
    durationLabel: elements.lifeGoalDuration.value,
    startDate: elements.lifeGoalStartDate.value,
    targetDate: elements.lifeGoalTargetDate.value,
    why: elements.lifeGoalWhy.value,
    milestonesText: elements.lifeGoalRoadmapInput.value,
    updatedAt: new Date().toISOString(),
  });
  persistLifeGoal();
  renderLifeGoal();
};

const resetLifeGoal = () => {
  state.lifeGoal = sanitizeLifeGoal(null);
  persistLifeGoal();
  renderLifeGoal();
};

const syncOllamaSessionDay = () => {
  const currentDay = todayKey();
  if (state.ollamaSessionDate === currentDay) {
    return false;
  }

  state.ollamaSessionDate = currentDay;
  state.ollamaMessages = [];
  state.ollamaBriefText = "";
  state.ollamaBriefGeneratedAt = "";
  state.ollamaAutoBriefDone = false;
  state.ollamaAutoBriefPending = false;
  state.ollamaAlerts = [];
  state.ollamaError = "";
  state.ollamaModel = "";
  state.ollamaGeneratedAt = "";
  state.ollamaContextLoaded = Boolean(state.dashboard && state.dashboard.sport);
  persistOllamaSession();
  return true;
};

const buildOllamaAlerts = (sport) => {
  if (!sport) {
    return [];
  }

  const alerts = [];
  const analytics = sport.analytics || {};
  const coachSignals = (sport.aiAnalysis && sport.aiAnalysis.coachSignals) || {};
  const loadRatio = Number(analytics.loadRatio7to28 || 0);
  const sleepDebtHours = Number(analytics.sleepDebtHours || 0);
  const bodyBattery = Number(sport.recovery?.wakeBodyBatteryAvg || 0);
  const stress = Number(sport.recovery?.stressAvg || 0);

  if (coachSignals.fatigueRisk === "high" || loadRatio >= 1.35) {
    alerts.push({
      level: "high",
      title: "Charge haute",
      text: coachSignals.alert || `Ratio 7j/28j eleve a ${formatNumber(loadRatio, 2)}x.`,
    });
  }

  if (sleepDebtHours >= 2.5) {
    alerts.push({
      level: sleepDebtHours >= 4 ? "high" : "moderate",
      title: "Dette sommeil",
      text: `${formatNumber(sleepDebtHours)} h de dette recente, a surveiller.`,
    });
  }

  if (bodyBattery > 0 && bodyBattery <= 42) {
    alerts.push({
      level: bodyBattery <= 30 ? "high" : "moderate",
      title: "Recuperation basse",
      text: `Body Battery reveil a ${formatNumber(bodyBattery, 0)}.`,
    });
  }

  if (stress >= 38) {
    alerts.push({
      level: "moderate",
      title: "Stress eleve",
      text: `Stress moyen a ${formatNumber(stress, 0)} sur la periode recente.`,
    });
  }

  if (!alerts.length && coachSignals.advice) {
    alerts.push({
      level: "calm",
      title: "RAS critique",
      text: coachSignals.advice,
    });
  }

  return alerts.slice(0, 4);
};

const upcomingSleepSunTargetDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return isoDateKey(date);
};

const parseIsoDateAtMinutes = (dateKey, totalMinutes) => {
  if (!dateKey || !Number.isFinite(totalMinutes)) {
    return null;
  }

  const [year, month, day] = String(dateKey).split("-").map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  date.setMinutes(Math.round(totalMinutes));
  return date;
};

const getSleepSunSchedule = (plan) => {
  if (!plan || !plan.date || !plan.sunrise || !plan.sunrise.iso) {
    return null;
  }

  const sunriseDate = new Date(plan.sunrise.iso);
  if (Number.isNaN(sunriseDate.getTime())) {
    return null;
  }

  const sunriseMinutes = sunriseDate.getHours() * 60 + sunriseDate.getMinutes();
  const bedtimeMinutes =
    plan.bedtimeForSunrise && Number.isFinite(Number(plan.bedtimeForSunrise.minutes))
      ? Number(plan.bedtimeForSunrise.minutes)
      : null;

  if (!Number.isFinite(bedtimeMinutes)) {
    return null;
  }

  const bedtimeDate = parseIsoDateAtMinutes(plan.date, bedtimeMinutes);
  if (!bedtimeDate) {
    return null;
  }

  if (bedtimeMinutes > sunriseMinutes) {
    bedtimeDate.setDate(bedtimeDate.getDate() - 1);
  }

  return {
    bedtimeDate,
    bedtimeReminderDate: new Date(bedtimeDate.getTime() - state.bedtimeReminderLeadMinutes * 60 * 1000),
    sunriseDate,
  };
};

const buildBedtimeReminderText = (plan) => {
  const bedtimeLabel =
    (plan && plan.bedtimeForSunrise && plan.bedtimeForSunrise.label) || "ton heure cible";
  const sunriseLabel = (plan && plan.sunrise && plan.sunrise.label) || "le lever du soleil";
  const leadLabel = minutesLabel(state.bedtimeReminderLeadMinutes);

  return [
    `Le coucher cible approche, il reste ${leadLabel} avant d aller dormir pour viser un reveil vers ${sunriseLabel}.`,
    `Ton coucher cible ce soir est ${bedtimeLabel}.`,
    "Pour faire baisser la temperature au maximum, ouvre la fenetre maintenant si l air dehors est plus frais, coupe le chauffage, eteins les appareils qui chauffent, ferme ensuite volets et rideaux pour garder la fraicheur, choisis des draps legers et utilise un ventilateur si tu en as un.",
    "Je n ai pas encore la temperature reelle de la chambre, donc je te donne les actions les plus efficaces tout de suite.",
  ].join(" ");
};

const renderRestModeState = () => {
  document.body.classList.toggle("bedtime-active", state.bedtimeModeActive);
};

const refreshRestModeState = () => {
  const schedule = getSleepSunSchedule(state.sleepSunPlan);
  const now = new Date();
  let bedtimeWindowActive = false;

  if (schedule) {
    bedtimeWindowActive = now >= schedule.bedtimeDate && now < schedule.sunriseDate;

    if (
      state.bedtimeReminderEnabled &&
      now >= schedule.bedtimeReminderDate &&
      now < schedule.bedtimeDate &&
      state.bedtimeVoiceReminderDate !== state.sleepSunPlan.date
    ) {
      state.bedtimeVoiceReminderDate = state.sleepSunPlan.date;
      persistRestModePreferences();
      speakText(buildBedtimeReminderText(state.sleepSunPlan));
    }
  }

  const bedtimeModeActive = bedtimeWindowActive && state.bedtimeBlackoutEnabled;

  if (bedtimeModeActive && !state.bedtimeModeActive) {
    state.bedtimeModeActive = true;
    enterBedtimeBlackout();
    window.clearTimeout(state.idleTimer);
  } else if (!bedtimeModeActive && state.bedtimeModeActive) {
    state.bedtimeModeActive = false;
    if (state.isIdle && state.overlayMode === "bedtime") {
      wakeInterface();
    }
  } else {
    state.bedtimeModeActive = bedtimeModeActive;
  }

  renderRestModeState();
  renderTabletMeta();
  renderSettings();
};

const normalizeSpeechText = (value) => {
  let text = String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\bTL\b/gi, "charge")
    .replace(/\bBB\b/gi, "body battery")
    .replace(/\bHRV\b/gi, "variabilite cardiaque")
    .replace(/\bVO2\b/gi, "V O deux")
    .replace(/\bkm\/h\b/gi, " kilomètres heure")
    .replace(/\bkm\b/gi, " kilomètres")
    .replace(/\bbpm\b/gi, " battements par minute")
    .replace(/\bmin\b/gi, " minutes")
    .replace(/\bW\b/g, " watts")
    .replace(/\b(\d{1,2})\s*h\s*(\d{1,2})\b/gi, (_match, hours, minutes) =>
      `${Number(hours)} heure${Number(hours) > 1 ? "s" : ""} ${Number(minutes)}`
    )
    .replace(/\b(\d{1,2}):(\d{2})\b/g, (_match, hours, minutes) =>
      `${Number(hours)} heure${Number(hours) > 1 ? "s" : ""} ${Number(minutes)}`
    )
    .replace(/([0-9])\.([0-9])/g, "$1 virgule $2")
    .replace(/([0-9]),([0-9])/g, "$1 virgule $2")
    .replace(/\/100/g, " sur 100")
    .replace(/%/g, " pour cent")
    .replace(/\s*:\s*/g, ", ")
    .replace(/\s*-\s*/g, ", ")
    .replace(/\s*\+\s*/g, " plus ")
    .trim();

  if (text && !/[.!?]$/.test(text)) {
    text = `${text}.`;
  }

  return text;
};

const splitSpeechText = (value) => {
  const text = normalizeSpeechText(value);
  if (!text) {
    return [];
  }

  const sentences = text
    .split(/(?<=[.!?;])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const chunks = [];
  let current = "";

  sentences.forEach((sentence) => {
    if (!current) {
      current = sentence;
      return;
    }

    if (`${current} ${sentence}`.length <= SPEECH_MAX_CHUNK_LENGTH) {
      current = `${current} ${sentence}`;
      return;
    }

    chunks.push(current);
    current = sentence;
  });

  if (current) {
    chunks.push(current);
  }

  return (chunks.length ? chunks : [text])
    .flatMap((chunk) =>
      chunk.length <= SPEECH_MAX_CHUNK_LENGTH
        ? [chunk]
        : chunk
            .split(/,\s+/)
            .map((part) => part.trim())
            .filter(Boolean)
    )
    .map((chunk) => chunk.replace(/\s+/g, " ").trim())
    .filter(Boolean);
};

const scoreSpeechVoice = (voice) => {
  if (!voice) {
    return -Infinity;
  }

  const lang = String(voice.lang || "").toLowerCase();
  if (!lang) {
    return -Infinity;
  }

  let score = 0;
  if (lang === "fr-fr") {
    score += 120;
  } else if (lang.startsWith("fr-")) {
    score += 100;
  } else if (lang === "fr") {
    score += 90;
  } else {
    return -Infinity;
  }

  const name = String(voice.name || "").toLowerCase();

  if (voice.default) {
    score += 12;
  }

  if (voice.localService === false) {
    score += 16;
  }

  SPEECH_PREFERRED_KEYWORDS.forEach((keyword) => {
    if (name.includes(keyword)) {
      score += 24;
    }
  });

  SPEECH_AVOID_KEYWORDS.forEach((keyword) => {
    if (name.includes(keyword)) {
      score -= 60;
    }
  });

  if (name.includes("local")) {
    score -= 10;
  }

  if (name.includes("google")) {
    score += 28;
  }

  if (name.includes("microsoft")) {
    score += 18;
  }

  if (name.includes("female") || name.includes("woman") || name.includes("femme")) {
    score += 18;
  }

  return score;
};

const pickSpeechVoice = () => {
  if (!state.ollamaSpeechSupported || !window.speechSynthesis) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!Array.isArray(voices) || !voices.length) {
    return null;
  }

  return voices
    .map((voice) => ({
      voice,
      score: scoreSpeechVoice(voice),
    }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((left, right) => right.score - left.score)[0]?.voice || null;
};

const stopSpeaking = () => {
  speechRunId += 1;
  if (state.ollamaSpeechSupported && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  state.ollamaSpeaking = false;
};

const speakText = (value) => {
  const chunks = splitSpeechText(value);
  if (!chunks.length || !state.ollamaSpeechSupported || !window.speechSynthesis) {
    return;
  }

  stopSpeaking();
  const runId = speechRunId;
  const voice = pickSpeechVoice();

  const speakChunk = (index) => {
    if (runId !== speechRunId) {
      return;
    }

    if (index >= chunks.length) {
      state.ollamaSpeaking = false;
      renderOllamaChat();
      return;
    }

    const utterance = new window.SpeechSynthesisUtterance(chunks[index]);
    utterance.lang = (voice && voice.lang) || "fr-FR";
    utterance.rate = index === 0 ? Math.min(1.2, state.speechRate + 0.01) : state.speechRate;
    utterance.pitch = state.speechPitch;
    utterance.volume = SPEECH_VOLUME;

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      if (runId !== speechRunId) {
        return;
      }

      window.setTimeout(() => {
        speakChunk(index + 1);
      }, state.speechPauseMs);
    };

    utterance.onerror = () => {
      if (runId !== speechRunId) {
        return;
      }

      state.ollamaSpeaking = false;
      renderOllamaChat();
    };

    window.speechSynthesis.speak(utterance);
  };

  state.ollamaSpeaking = true;
  renderOllamaChat();
  window.setTimeout(() => {
    speakChunk(0);
  }, 60);
};

const initializeVoiceRecognition = () => {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  state.ollamaRecognitionSupported = typeof Recognition === "function";
  state.ollamaSpeechSupported =
    typeof window.SpeechSynthesisUtterance === "function" && "speechSynthesis" in window;

  if (!state.ollamaRecognitionSupported || state.ollamaRecognition) {
    return;
  }

  const recognition = new Recognition();
  recognition.lang = "fr-FR";
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition._finalTranscript = "";

  recognition.addEventListener("start", () => {
    state.ollamaListening = true;
    state.ollamaError = "";
    renderOllamaChat();
  });

  recognition.addEventListener("result", (event) => {
    let finalTranscript = "";
    let interimTranscript = "";

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = String(event.results[index][0]?.transcript || "").trim();
      if (!transcript) {
        continue;
      }

      if (event.results[index].isFinal) {
        finalTranscript += `${transcript} `;
      } else {
        interimTranscript += `${transcript} `;
      }
    }

    recognition._finalTranscript = String(recognition._finalTranscript || "") + finalTranscript;
    const visibleTranscript = String(recognition._finalTranscript || interimTranscript || "").trim();
    if (visibleTranscript) {
      elements.ollamaChatInput.value = visibleTranscript;
    }
  });

  recognition.addEventListener("error", (event) => {
    state.ollamaListening = false;
    state.ollamaError = event.error === "not-allowed" ? "Micro refuse par le navigateur." : "Micro indisponible.";
    renderOllamaChat();
  });

  recognition.addEventListener("end", () => {
    const transcript = String(recognition._finalTranscript || elements.ollamaChatInput.value || "").trim();
    recognition._finalTranscript = "";
    state.ollamaListening = false;
    renderOllamaChat();

    if (transcript) {
      submitOllamaPrompt(transcript, { source: "voice" }).catch((error) => {
        state.ollamaIsSending = false;
        state.ollamaError = error.message || "Impossible de contacter Ollama.";
        renderOllamaChat();
      });
    }
  });

  state.ollamaRecognition = recognition;
};

const toggleVoiceInput = () => {
  if (!state.ollamaRecognitionSupported || !state.ollamaRecognition) {
    state.ollamaError = "Reconnaissance vocale indisponible sur cette tablette.";
    renderOllamaChat();
    return;
  }

  if (state.ollamaListening) {
    state.ollamaRecognition.stop();
    return;
  }

  elements.ollamaChatInput.value = "";
  state.ollamaError = "";
  try {
    state.ollamaRecognition.start();
  } catch (error) {
    state.ollamaError = error.message || "Impossible de demarrer le micro.";
    renderOllamaChat();
  }
};

const toggleAutoSpeak = () => {
  if (!state.ollamaSpeechSupported) {
    state.ollamaError = "Lecture vocale indisponible sur cette tablette.";
    renderOllamaChat();
    renderSettings();
    return;
  }

  setAutoSpeakEnabled(!state.ollamaAutoSpeakEnabled);
};

const setAccessibilityMode = (enabled) => {
  state.accessibilityMode = Boolean(enabled);
  persistDisplayPreferences();
  renderAccessibilityMode();
  renderTabletMeta();
  renderSettings();
};

const setAutoSpeakEnabled = (enabled) => {
  if (!state.ollamaSpeechSupported) {
    state.ollamaAutoSpeakEnabled = false;
    state.ollamaError = "Lecture vocale indisponible sur cette tablette.";
    renderOllamaChat();
    renderSettings();
    return;
  }

  state.ollamaAutoSpeakEnabled = Boolean(enabled);
  if (!state.ollamaAutoSpeakEnabled) {
    stopSpeaking();
  }
  persistOllamaPreferences();
  renderOllamaChat();
  renderSettings();
};

const setSpeechRate = (value) => {
  state.speechRate = clampNumber(value, DEFAULT_SPEECH_RATE, 0.75, 1.1);
  persistOllamaPreferences();
  renderSettings();
};

const setSpeechPitch = (value) => {
  state.speechPitch = clampNumber(value, DEFAULT_SPEECH_PITCH, 0.85, 1.2);
  persistOllamaPreferences();
  renderSettings();
};

const setSpeechPauseMs = (value) => {
  state.speechPauseMs = clampNumber(value, DEFAULT_SPEECH_PAUSE_MS, 80, 600);
  persistOllamaPreferences();
  renderSettings();
};

const setIdleTimeoutSeconds = (value) => {
  state.idleTimeoutSeconds = clampNumber(value, DEFAULT_IDLE_TIMEOUT_SECONDS, 30, 600);
  persistDisplayPreferences();
  renderTabletMeta();
  renderSettings();
  armIdleTimer();
};

const setBedtimeReminderEnabled = (enabled) => {
  state.bedtimeReminderEnabled = Boolean(enabled);
  state.bedtimeVoiceReminderDate = "";
  persistRestModePreferences();
  refreshRestModeState();
  armIdleTimer();
};

const setBedtimeReminderLeadMinutes = (value) => {
  state.bedtimeReminderLeadMinutes = clampNumber(value, DEFAULT_BEDTIME_VOICE_LEAD_MINUTES, 5, 120);
  state.bedtimeVoiceReminderDate = "";
  persistRestModePreferences();
  refreshRestModeState();
  armIdleTimer();
};

const setBedtimeBlackoutEnabled = (enabled) => {
  state.bedtimeBlackoutEnabled = Boolean(enabled);
  persistRestModePreferences();
  refreshRestModeState();
  armIdleTimer();
};

const setBedtimeWakeTimeoutSeconds = (value) => {
  state.bedtimeWakeTimeoutSeconds = clampNumber(value, DEFAULT_BEDTIME_WAKE_TIMEOUT_SECONDS, 10, 300);
  persistRestModePreferences();
  renderSettings();
  armIdleTimer();
};

const previewIdleOverlay = () => {
  window.clearTimeout(state.idleTimer);
  enterOverlay("idle");
};

const previewNightOverlay = () => {
  window.clearTimeout(state.idleTimer);
  enterOverlay("bedtime");
};

const renderOllamaOverview = () => {
  const sport = state.dashboard && state.dashboard.sport;
  state.ollamaAlerts = buildOllamaAlerts(sport);

  const briefText = state.ollamaBriefText
    ? state.ollamaBriefText
    : sport
      ? state.ollamaAutoBriefPending
        ? "Le brief automatique est en cours de generation."
        : "Le brief automatique se preparera ici a l ouverture ou le matin."
      : "Le brief attend le chargement des donnees sport.";
  const briefMeta = state.ollamaBriefGeneratedAt
    ? `Genere ${formatDate(state.ollamaBriefGeneratedAt)}`
    : state.ollamaAutoBriefPending
      ? "Ollama travaille..."
      : "Pas encore genere aujourd hui";

  elements.ollamaBriefCard.innerHTML = `
    <p class="ollama-summary-kicker">Brief automatique</p>
    <p class="ollama-summary-value">${escapeHtml(truncateText(briefText, 240) || "En attente.")}</p>
    <p class="ollama-summary-note">${escapeHtml(briefMeta)}</p>
  `;

  if (!state.ollamaAlerts.length) {
    elements.ollamaAlerts.innerHTML = `
      <p class="ollama-summary-kicker">Alertes intelligentes</p>
      <p class="ollama-summary-value">Aucune alerte prioritaire.</p>
      <p class="ollama-summary-note">Le coach local ne voit pas de signal urgent sur les donnees chargees.</p>
    `;
  } else {
    elements.ollamaAlerts.innerHTML = `
      <p class="ollama-summary-kicker">Alertes intelligentes</p>
      <div class="ollama-alert-list">
        ${state.ollamaAlerts
          .map(
            (alert) => `
              <article class="ollama-alert-item ${escapeHtml(alert.level)}">
                <p class="ollama-alert-title">${escapeHtml(alert.title)}</p>
                <p class="ollama-alert-text">${escapeHtml(alert.text)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  }

  const userTurns = state.ollamaMessages.filter((message) => message.role === "user").length;
  const lastUserMessage = getLastMessageByRole("user");
  const lastAssistantMessage = getLastMessageByRole("assistant");
  const lastAdvice = state.ollamaBriefText || (lastAssistantMessage && lastAssistantMessage.content) || "";

  elements.ollamaMemory.innerHTML = `
    <p class="ollama-summary-kicker">Memoire courte</p>
    <p class="ollama-summary-value">${escapeHtml(`${userTurns} echange${userTurns > 1 ? "s" : ""} aujourd hui`)}</p>
    <div class="ollama-memory-list">
      <div class="ollama-memory-row">
        <span>Derniere question</span>
        <strong>${escapeHtml(truncateText(lastUserMessage && lastUserMessage.content, 88) || "Aucune pour l instant.")}</strong>
      </div>
      <div class="ollama-memory-row">
        <span>Dernier conseil</span>
        <strong>${escapeHtml(truncateText(lastAdvice, 108) || "Le brief du jour apparaitra ici.")}</strong>
      </div>
      <div class="ollama-memory-row">
        <span>Session</span>
        <strong>${escapeHtml(state.ollamaSessionDate || todayKey())}</strong>
      </div>
    </div>
  `;
};

const renderOllamaChat = () => {
  renderOllamaOverview();

  const messages = state.ollamaMessages.length
    ? state.ollamaMessages
    : [{ role: "assistant", content: DEFAULT_OLLAMA_GREETING }];

  elements.ollamaChatMessages.innerHTML = messages
    .map(
      (message) => `
        <article class="ollama-chat-bubble ${escapeHtml(message.role)}">
          <p class="ollama-chat-role">${message.role === "user" ? "Toi" : "Ollama"}</p>
          <p class="ollama-chat-text">${escapeHtml(message.content)}</p>
        </article>
      `
    )
    .join("");

  const chatReady = state.dashboard && state.dashboard.sport;
  const statusFlags = [];
  if (state.ollamaListening) {
    statusFlags.push("micro actif");
  }
  if (state.ollamaSpeaking) {
    statusFlags.push("lecture audio");
  }

  let statusMessage = "";
  if (state.ollamaIsSending) {
    statusMessage = "Ollama ecrit...";
  } else if (state.ollamaError) {
    statusMessage = `Erreur: ${state.ollamaError}`;
  } else if (state.ollamaModel) {
    statusMessage = `Modele ${state.ollamaModel}${state.ollamaGeneratedAt ? ` - ${formatDate(state.ollamaGeneratedAt)}` : ""}${
      state.ollamaContextLoaded ? " - contexte sport charge" : ""
    }`;
  } else if (chatReady) {
    statusMessage = "Pret a discuter avec le contexte sport du dashboard.";
  } else {
    statusMessage = "Pret a discuter. Le contexte sport se chargera des que possible.";
  }

  if (statusFlags.length) {
    statusMessage = `${statusMessage} - ${statusFlags.join(" - ")}`;
  }

  elements.ollamaChatMeta.textContent = statusMessage;
  elements.ollamaChatInput.disabled = state.ollamaIsSending || state.ollamaListening;
  elements.ollamaChatReset.disabled =
    state.ollamaIsSending || (!state.ollamaMessages.length && !state.ollamaBriefText);
  elements.ollamaChatSend.disabled = state.ollamaIsSending || state.ollamaListening;
  elements.ollamaChatSend.textContent = state.ollamaIsSending ? "Envoi..." : "Envoyer";
  elements.ollamaVoiceButton.disabled =
    state.ollamaIsSending || !state.ollamaRecognitionSupported || !state.ollamaRecognition;
  elements.ollamaVoiceButton.textContent = state.ollamaListening
    ? "Ecoute..."
    : state.ollamaRecognitionSupported
      ? "Parler"
      : "Micro indispo";
  elements.ollamaSpeakToggle.disabled = !state.ollamaSpeechSupported;
  elements.ollamaSpeakToggle.textContent = state.ollamaAutoSpeakEnabled ? "Voix ON" : "Voix OFF";
  elements.ollamaSpeakToggle.classList.toggle("is-active", state.ollamaAutoSpeakEnabled);
  elements.ollamaQuickPrompts.querySelectorAll("[data-prompt]").forEach((button) => {
    button.disabled = state.ollamaIsSending || state.ollamaListening;
  });
  elements.ollamaChatMessages.scrollTop = elements.ollamaChatMessages.scrollHeight;
};

const requestOllamaReply = async (
  promptText,
  { displayUserMessage = true, storeAsBrief = false, source = "manual" } = {}
) => {
  const prompt = String(promptText || "").trim();
  if (!prompt || state.ollamaIsSending) {
    return;
  }

  armIdleTimer();
  state.ollamaError = "";

  const conversationForApi = sanitizeOllamaMessages([...state.ollamaMessages, { role: "user", content: prompt }]);
  if (displayUserMessage) {
    state.ollamaMessages = conversationForApi;
    elements.ollamaChatInput.value = "";
  }

  state.ollamaIsSending = true;
  if (storeAsBrief) {
    state.ollamaAutoBriefPending = true;
  }
  persistOllamaSession();
  renderOllamaChat();

  try {
    const response = await apiRequest("/api/ollama/chat", {
      messages: conversationForApi,
    });

    const assistantMessage =
      response && response.message && typeof response.message.content === "string"
        ? response.message.content.trim()
        : "";

    if (!assistantMessage) {
      throw new Error("Ollama n a pas renvoye de texte.");
    }

    state.ollamaMessages = sanitizeOllamaMessages([...state.ollamaMessages, { role: "assistant", content: assistantMessage }]);
    state.ollamaModel = response.model || state.ollamaModel;
    state.ollamaGeneratedAt = response.generatedAt || "";
    state.ollamaContextLoaded = Boolean(response.contextLoaded);

    if (storeAsBrief) {
      state.ollamaBriefText = assistantMessage;
      state.ollamaBriefGeneratedAt = response.generatedAt || new Date().toISOString();
      state.ollamaAutoBriefDone = true;
    }

    persistOllamaSession();

    if (state.ollamaAutoSpeakEnabled && source !== "silent") {
      speakText(assistantMessage);
    }
  } catch (error) {
    state.ollamaError = error.message || "Impossible de contacter Ollama.";
  } finally {
    state.ollamaIsSending = false;
    state.ollamaAutoBriefPending = false;
    renderOllamaChat();
  }
};

const maybeRunAutomaticBrief = () => {
  if (!state.dashboard || !state.dashboard.sport || state.ollamaAutoBriefDone || state.ollamaAutoBriefPending || state.ollamaIsSending) {
    return;
  }

  requestOllamaReply(AUTOMATIC_BRIEF_PROMPT, {
    displayUserMessage: false,
    storeAsBrief: true,
    source: "auto-brief",
  }).catch((error) => {
    state.ollamaIsSending = false;
    state.ollamaAutoBriefPending = false;
    state.ollamaError = error.message || "Impossible de generer le brief automatique.";
    renderOllamaChat();
  });
};

const resetOllamaChat = () => {
  state.ollamaMessages = [];
  state.ollamaError = "";
  state.ollamaModel = "";
  state.ollamaGeneratedAt = "";
  state.ollamaContextLoaded = Boolean(state.dashboard && state.dashboard.sport);
  state.ollamaBriefText = "";
  state.ollamaBriefGeneratedAt = "";
  state.ollamaAutoBriefDone = false;
  state.ollamaAutoBriefPending = false;
  stopSpeaking();
  persistOllamaSession();
  renderOllamaChat();
};

const submitOllamaPrompt = async (promptText, options = {}) => {
  const prompt = String(promptText || elements.ollamaChatInput.value || "").trim();
  if (!prompt) {
    return;
  }

  await requestOllamaReply(prompt, {
    displayUserMessage: true,
    storeAsBrief: false,
    ...options,
  });
};

const renderAll = () => {
  renderRefreshMeta();
  renderSport();
  renderFitness();
  renderNutrition();
  renderLifeGoal();
  renderLights();
  renderSettings();
  renderDiagnostics();
  renderOllamaChat();
};

const apiRequest = async (path, payload) => {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawBody = await response.text();

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errorBody = rawBody ? JSON.parse(rawBody) : null;
      if (errorBody && errorBody.message) {
        message = errorBody.message;
      }
    } catch (_error) {
      // Ignore JSON parse issues and keep HTTP status.
    }
    throw new Error(message);
  }

  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch (_error) {
    return rawBody;
  }
};

const loadSleepSunPlan = async () => {
  const targetDate = upcomingSleepSunTargetDate();

  if (state.sleepSunPlanTargetDate === targetDate && state.sleepSunPlan) {
    refreshRestModeState();
    return;
  }

  try {
    const url = new URL("/api/sleep-sun", window.location.origin);
    url.searchParams.set("date", targetDate);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    state.sleepSunPlan = await response.json();
    state.sleepSunPlanTargetDate = targetDate;
    state.sleepSunPlanError = "";
  } catch (error) {
    state.sleepSunPlanError = error.message || "Plan sommeil indisponible.";
  } finally {
    refreshRestModeState();
  }
};

const withBusyLights = async (uiIds, action) => {
  const ids = Array.isArray(uiIds) ? uiIds : [uiIds];
  ids.forEach((uiId) => state.busyLightIds.add(uiId));
  renderLights();
  try {
    await action();
  } finally {
    ids.forEach((uiId) => state.busyLightIds.delete(uiId));
    renderLights();
  }
};

const handleLightToggle = async (button) => {
  const provider = button.dataset.provider;
  const lightId = button.dataset.lightId;
  const nextOn = button.dataset.nextOn === "true";
  const uiId = `${provider}:${lightId}`;

  await withBusyLights([uiId], async () => {
    await apiRequest(`/api/lights/${encodeURIComponent(provider)}/${encodeURIComponent(lightId)}/toggle`, {
      on: nextOn,
    });
    await loadDashboard(true);
  });
};

const handleLightGroupToggle = async (button) => {
  const provider = button.dataset.provider;
  const nextOn = button.dataset.nextOn === "true";
  const groupUiId = button.dataset.uiId || `${provider}:group`;
  const lightIds = parseLightIds(button.dataset.lightIds);

  if (!provider || !lightIds.length) {
    return;
  }

  const memberUiIds = lightIds.map((lightId) => `${provider}:${lightId}`);

  await withBusyLights([groupUiId, ...memberUiIds], async () => {
    for (const lightId of lightIds) {
      await apiRequest(`/api/lights/${encodeURIComponent(provider)}/${encodeURIComponent(lightId)}/toggle`, {
        on: nextOn,
      });
    }
    await loadDashboard(true);
  });
};

const handleLightGroupBrightness = async (input) => {
  const provider = input.dataset.provider;
  const groupUiId = input.dataset.uiId || `${provider}:group`;
  const lightIds = parseLightIds(input.dataset.lightIds);
  const brightness = Number(input.value);

  if (!provider || !lightIds.length) {
    return;
  }

  const memberUiIds = lightIds.map((lightId) => `${provider}:${lightId}`);

  await withBusyLights([groupUiId, ...memberUiIds], async () => {
    for (const lightId of lightIds) {
      await apiRequest(`/api/lights/${encodeURIComponent(provider)}/${encodeURIComponent(lightId)}/brightness`, {
        brightness,
      });
    }
    await loadDashboard(true);
  });
};

const handleBrightness = async (input) => {
  const provider = input.dataset.provider;
  const lightId = input.dataset.lightId;
  const uiId = input.dataset.uiId;
  const brightness = Number(input.value);

  await withBusyLights([uiId], async () => {
    await apiRequest(`/api/lights/${encodeURIComponent(provider)}/${encodeURIComponent(lightId)}/brightness`, {
      brightness,
    });
    await loadDashboard(true);
  });
};

const handleLightGroupColor = async (input) => {
  const provider = input.dataset.provider;
  const groupUiId = input.dataset.uiId || `${provider}:group`;
  const lightIds = parseLightIds(input.dataset.lightIds);
  const color = normalizeColorHex(input.value, "#ffffff");

  if (!provider || !lightIds.length) {
    return;
  }

  const memberUiIds = lightIds.map((lightId) => `${provider}:${lightId}`);

  await withBusyLights([groupUiId, ...memberUiIds], async () => {
    for (const lightId of lightIds) {
      await apiRequest(`/api/lights/${encodeURIComponent(provider)}/${encodeURIComponent(lightId)}/color`, {
        color,
      });
    }
    await loadDashboard(true);
  });
};

const handleColorChange = async (input) => {
  const provider = input.dataset.provider;
  const lightId = input.dataset.lightId;
  const uiId = input.dataset.uiId;
  const color = normalizeColorHex(input.value, "#ffffff");

  await withBusyLights([uiId], async () => {
    await apiRequest(`/api/lights/${encodeURIComponent(provider)}/${encodeURIComponent(lightId)}/color`, {
      color,
    });
    await loadDashboard(true);
  });
};

const updateBrightnessLabel = (uiId, value) => {
  const labels = elements.lightsGroups.querySelectorAll('[data-role="brightness-value"]');
  labels.forEach((label) => {
    if (label.dataset.uiId === uiId) {
      label.textContent = `${value}%`;
    }
  });
};

const loadDashboard = async (forceLive) => {
  syncOllamaSessionDay();
  refreshRestModeState();

  if (state.isLoading) {
    return;
  }

  state.isLoading = true;
  state.fetchError = "";
  renderRefreshMeta();

  try {
    const url = new URL("/api/dashboard", window.location.origin);
    if (forceLive) {
      url.searchParams.set("live", "1");
    }

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    state.dashboard = await response.json();
    state.ollamaContextLoaded = Boolean(state.dashboard && state.dashboard.sport);
    await loadSleepSunPlan();
    renderAll();
    maybeRunAutomaticBrief();
    scheduleRefresh(state.dashboard.refreshIntervalMs);
  } catch (error) {
    state.fetchError = error.message || "Dashboard unavailable.";
    renderDiagnostics();
    renderOllamaChat();
    scheduleRefresh(15_000);
  } finally {
    state.isLoading = false;
    renderRefreshMeta();
  }
};

elements.refreshButton.addEventListener("click", () => {
  armIdleTimer();
  loadDashboard(true);
});

elements.accessibilityToggle.addEventListener("click", () => {
  armIdleTimer();
  setAccessibilityMode(!state.accessibilityMode);
});

elements.fullscreenButton.addEventListener("click", () => {
  armIdleTimer();
  toggleFullscreen().catch((error) => {
    state.fetchError = error.message || "Impossible de basculer en plein ecran.";
    renderDiagnostics();
    renderRefreshMeta();
  });
});

elements.idleVeil.addEventListener("click", () => {
  armIdleTimer();
});

["pointerdown", "pointermove", "keydown", "touchstart"].forEach((eventName) => {
  window.addEventListener(
    eventName,
    () => {
      armIdleTimer();
    },
    { passive: true }
  );
});

document.addEventListener("fullscreenchange", () => {
  renderTabletMeta();
});

elements.ollamaChatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitOllamaPrompt().catch((error) => {
    state.ollamaIsSending = false;
    state.ollamaError = error.message || "Impossible de contacter Ollama.";
    renderOllamaChat();
  });
});

elements.ollamaChatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    submitOllamaPrompt().catch((error) => {
      state.ollamaIsSending = false;
      state.ollamaError = error.message || "Impossible de contacter Ollama.";
      renderOllamaChat();
    });
  }
});

elements.ollamaChatReset.addEventListener("click", () => {
  armIdleTimer();
  resetOllamaChat();
});

elements.ollamaQuickPrompts.addEventListener("click", (event) => {
  const button = event.target.closest("[data-prompt]");
  if (!button) {
    return;
  }

  submitOllamaPrompt(button.dataset.prompt || "").catch((error) => {
    state.ollamaIsSending = false;
    state.ollamaError = error.message || "Impossible de contacter Ollama.";
    renderOllamaChat();
  });
});

elements.ollamaVoiceButton.addEventListener("click", () => {
  armIdleTimer();
  toggleVoiceInput();
});

elements.ollamaSpeakToggle.addEventListener("click", () => {
  armIdleTimer();
  toggleAutoSpeak();
});

elements.settingsAccessibility.addEventListener("change", () => {
  armIdleTimer();
  setAccessibilityMode(elements.settingsAccessibility.checked);
});

elements.settingsAutoSpeak.addEventListener("change", () => {
  armIdleTimer();
  setAutoSpeakEnabled(elements.settingsAutoSpeak.checked);
});

elements.settingsSpeechRate.addEventListener("input", () => {
  armIdleTimer();
  setSpeechRate(elements.settingsSpeechRate.value);
});

elements.settingsSpeechPitch.addEventListener("input", () => {
  armIdleTimer();
  setSpeechPitch(elements.settingsSpeechPitch.value);
});

elements.settingsSpeechPause.addEventListener("input", () => {
  armIdleTimer();
  setSpeechPauseMs(elements.settingsSpeechPause.value);
});

elements.settingsIdleTimeout.addEventListener("input", () => {
  setIdleTimeoutSeconds(elements.settingsIdleTimeout.value);
});

elements.settingsBedtimeReminder.addEventListener("change", () => {
  setBedtimeReminderEnabled(elements.settingsBedtimeReminder.checked);
});

elements.settingsReminderLead.addEventListener("input", () => {
  setBedtimeReminderLeadMinutes(elements.settingsReminderLead.value);
});

elements.settingsBedtimeBlackout.addEventListener("change", () => {
  setBedtimeBlackoutEnabled(elements.settingsBedtimeBlackout.checked);
});

elements.settingsWakeTimeout.addEventListener("input", () => {
  setBedtimeWakeTimeoutSeconds(elements.settingsWakeTimeout.value);
});

elements.settingsPreviewIdle.addEventListener("click", () => {
  previewIdleOverlay();
});

elements.settingsPreviewNight.addEventListener("click", () => {
  previewNightOverlay();
});

elements.settingsReset.addEventListener("click", () => {
  armIdleTimer();
  resetSettings();
});

elements.lifeGoalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  armIdleTimer();
  saveLifeGoal();
});

elements.lifeGoalReset.addEventListener("click", () => {
  armIdleTimer();
  resetLifeGoal();
});

elements.lightsGroups.addEventListener("click", (event) => {
  const groupButton = findActionTarget(event.target, "toggle-group");
  if (groupButton) {
    handleLightGroupToggle(groupButton).catch((error) => {
      state.fetchError = error.message || "Impossible de changer le groupe de lumieres.";
      renderDiagnostics();
    });
    return;
  }

  const button = findActionTarget(event.target, "toggle");
  if (!button) {
    return;
  }

  handleLightToggle(button).catch((error) => {
    state.fetchError = error.message || "Impossible de changer la lumiere.";
    renderDiagnostics();
  });
});

elements.lightsGroups.addEventListener("input", (event) => {
  const groupInput = findActionTarget(event.target, "brightness-group");
  if (groupInput) {
    updateBrightnessLabel(groupInput.dataset.uiId, groupInput.value);
    return;
  }

  const input = findActionTarget(event.target, "brightness");
  if (input) {
    updateBrightnessLabel(input.dataset.uiId, input.value);
  }
});

elements.lightsGroups.addEventListener("change", (event) => {
  const brightnessGroupInput = findActionTarget(event.target, "brightness-group");
  if (brightnessGroupInput) {
    handleLightGroupBrightness(brightnessGroupInput).catch((error) => {
      state.fetchError = error.message || "Impossible de regler la luminosite du groupe.";
      renderDiagnostics();
    });
    return;
  }

  const brightnessInput = findActionTarget(event.target, "brightness");
  if (brightnessInput) {
    handleBrightness(brightnessInput).catch((error) => {
      state.fetchError = error.message || "Impossible de regler la luminosite.";
      renderDiagnostics();
    });
    return;
  }

  const colorGroupInput = findActionTarget(event.target, "color-group");
  if (colorGroupInput) {
    handleLightGroupColor(colorGroupInput).catch((error) => {
      state.fetchError = error.message || "Impossible de changer la couleur du groupe.";
      renderDiagnostics();
    });
    return;
  }

  const colorInput = findActionTarget(event.target, "color");
  if (colorInput) {
    handleColorChange(colorInput).catch((error) => {
      state.fetchError = error.message || "Impossible de changer la couleur.";
      renderDiagnostics();
    });
  }
});

initializeVoiceRecognition();
if (state.ollamaSpeechSupported && window.speechSynthesis && "onvoiceschanged" in window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    renderOllamaChat();
  };
}

renderAccessibilityMode();
renderAll();
updateSurfaceMode();
renderClock();
state.clockTimer = window.setInterval(() => {
  updateSurfaceMode();
  renderClock();
  if (state.sleepSunPlanTargetDate !== upcomingSleepSunTargetDate()) {
    loadSleepSunPlan().catch(() => {});
  } else {
    refreshRestModeState();
  }
  if (syncOllamaSessionDay()) {
    renderOllamaChat();
  }
}, 60_000);
armIdleTimer();
loadSleepSunPlan().catch(() => {});
loadDashboard(true);
