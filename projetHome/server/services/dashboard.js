const { config } = require("../config");
const { fetchFitnessSnapshot } = require("./fitness");
const { getSportSummary } = require("./garminSummary");
const { fetchLightsSnapshot } = require("./lights");
const { fetchNutritionSnapshot } = require("./nutrition");

let cache = {
  expiresAt: 0,
  value: null,
};

const warningWithScope = (scope, message) => ({
  scope,
  message,
});

const OPTIONAL_WARNING_SCOPES = new Set(["fitness", "nutrition"]);

const pushWarning = (warnings, scope, message) => {
  if (OPTIONAL_WARNING_SCOPES.has(scope)) {
    return;
  }

  warnings.push(warningWithScope(scope, message));
};

const getDashboardSnapshot = async ({ forceLive = false } = {}) => {
  if (!forceLive && cache.value && Date.now() < cache.expiresAt) {
    return cache.value;
  }

  const warnings = [];
  const [fitnessResult, nutritionResult, lightsResult, sportResult] = await Promise.allSettled([
    fetchFitnessSnapshot(config, { forceLive }),
    fetchNutritionSnapshot(config),
    fetchLightsSnapshot(config),
    Promise.resolve().then(() => getSportSummary(config)),
  ]);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    refreshIntervalMs: config.app.refreshIntervalMs,
    fitness: null,
    sport: null,
    nutrition: null,
    lights: [],
    warnings,
  };

  if (fitnessResult.status === "fulfilled") {
    snapshot.fitness = fitnessResult.value;
  } else {
    pushWarning(warnings, "fitness", fitnessResult.reason.message || "Fitness API unavailable.");
  }

  if (nutritionResult.status === "fulfilled") {
    snapshot.nutrition = nutritionResult.value;
  } else {
    pushWarning(warnings, "nutrition", nutritionResult.reason.message || "Nutrition API unavailable.");
  }

  if (sportResult.status === "fulfilled") {
    snapshot.sport = sportResult.value;
  } else {
    pushWarning(warnings, "sport", sportResult.reason.message || "Sport summary unavailable.");
  }

  if (lightsResult.status === "fulfilled") {
    snapshot.lights = lightsResult.value.lights;
    lightsResult.value.warnings.forEach((message) => pushWarning(warnings, "lights", message));
  } else {
    pushWarning(warnings, "lights", lightsResult.reason.message || "Lights API unavailable.");
  }

  cache = {
    value: snapshot,
    expiresAt: Date.now() + config.app.cacheTtlMs,
  };

  return snapshot;
};

const invalidateDashboardCache = () => {
  cache = {
    value: null,
    expiresAt: 0,
  };
};

module.exports = {
  getDashboardSnapshot,
  invalidateDashboardCache,
};
