const fs = require("node:fs/promises");
const path = require("node:path");

const { buildSummary } = require("../projetHome/server/services/garminSummaryBuild");
const { dedupeExports } = require("../projetHome/server/services/garminSummaryShared");

const DEFAULT_OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || "";
const DEFAULT_TEMPERATURE = Number.isFinite(Number(process.env.OLLAMA_TEMPERATURE))
  ? Number(process.env.OLLAMA_TEMPERATURE)
  : 0.4;
const DEFAULT_NUM_PREDICT = Number.isFinite(Number(process.env.OLLAMA_NUM_PREDICT))
  ? Number(process.env.OLLAMA_NUM_PREDICT)
  : 700;
const PREFERRED_OLLAMA_MODELS = ["gemma3:4b", "phi3:mini", "llama3.2:3b"];
const ANALYSIS_SYSTEM_PROMPT = [
  "Tu es un coach sportif analytique francophone.",
  "Tu rediges un compte-rendu utile pour un dashboard personnel.",
  "Tu n as pas le droit de recopier les donnees source ni de produire du JSON.",
  "Interdits absolus: markdown, tableaux, puces, titres, code fences, backticks et listes numerotees.",
  "Commence directement par l analyse et ecris uniquement en texte brut."
].join(" ");
const COACH_SIGNAL_SYSTEM_PROMPT = [
  "Tu es un coach sportif analytique francophone.",
  "Tu dois produire une synthese ultra courte et exploitable pour un dashboard.",
  "Retourne uniquement un objet JSON valide sans markdown ni commentaire.",
  "Les phrases doivent etre directes, utiles, et ne pas inventer d informations.",
].join(" ");

const printHelp = () => {
  console.log(`
Usage:
  node ollama-analyze.js [options]

Options:
  --exports-dir <path>     Exports Garmin a analyser (default: ./exports)
  --model <name>           Modele Ollama (default: auto)
  --base-url <url>         Endpoint Ollama (default: ${DEFAULT_OLLAMA_BASE_URL})
  --dry-run                N appelle pas Ollama, affiche seulement le plan d execution
  --help                   Affiche cette aide
`);
};

const toAbsoluteExportsDir = (value) =>
  value
    ? path.resolve(value)
    : process.env.GARMIN_CRAWLER_EXPORTS_PATH
      ? path.resolve(process.env.GARMIN_CRAWLER_EXPORTS_PATH)
      : path.resolve(__dirname, "exports");

const parseArgs = (argv) => {
  const args = {
    exportsDir: toAbsoluteExportsDir(),
    baseUrl: DEFAULT_OLLAMA_BASE_URL.replace(/\/+$/, ""),
    model: DEFAULT_OLLAMA_MODEL,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--help") {
      args.help = true;
      continue;
    }

    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    const nextValue = argv[index + 1];
    if (!nextValue || nextValue.startsWith("--")) {
      throw new Error(`Missing value for ${token}`);
    }

    if (token === "--exports-dir") {
      args.exportsDir = toAbsoluteExportsDir(nextValue);
      index += 1;
      continue;
    }

    if (token === "--model") {
      args.model = nextValue.trim();
      index += 1;
      continue;
    }

    if (token === "--base-url") {
      args.baseUrl = nextValue.trim().replace(/\/+$/, "");
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${token}`);
  }

  return args;
};

const selectLatestExportName = (exportsData) =>
  exportsData.latestActivityDetailExport ||
  exportsData.latestActivityExport ||
  exportsData.latestDailyExport ||
  exportsData.latestSleepExport ||
  null;

const buildAnalysisPayload = (summary) => ({
  source: summary.source,
  overview: summary.overview,
  recent7: summary.recent7,
  recent28: summary.recent28,
  recovery: summary.recovery,
  sleep: {
    scoreAvg: summary.sleep?.scoreAvg ?? null,
    durationAvg: summary.sleep?.durationAvg ?? null,
    hrvAvg: summary.sleep?.hrvAvg ?? null,
    stressAvg: summary.sleep?.stressAvg ?? null,
    sleepNeedAvgMinutes: summary.sleep?.sleepNeedAvgMinutes ?? null,
    recentNights: (summary.sleep?.recentNights || []).slice(-5),
  },
  patterns: summary.patterns,
  topLocations: summary.geography?.topLocations || [],
  performance: summary.performance,
  recentActivities: (summary.recentActivities || []).slice(0, 8).map((activity) => ({
    name: activity.name,
    typeKey: activity.typeKey,
    dateLocal: activity.dateLocal,
    locationName: activity.locationName || null,
    distanceKm: activity.distanceKm,
    durationMin: activity.durationMin,
    elevationM: activity.elevationM,
    trainingLoad: activity.trainingLoad,
    averageHr: activity.averageHr,
    maxHr: activity.maxHr,
    averageSpeedKmh: activity.averageSpeedKmh ?? null,
    paceSecPerKm: activity.paceSecPerKm,
    normalizedPower: activity.normalizedPower || null,
    averageCadence: activity.averageCadence || null,
    minAvailableStamina: activity.minAvailableStamina ?? null,
    differenceBodyBattery: activity.differenceBodyBattery ?? null,
    splitPreview: activity.splitPreview || [],
  })),
});

const formatValue = (value, fractionDigits = 1) => {
  if (value === null || value === undefined || value === "") {
    return "n/a";
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return String(value);
  }

  const rounded = Number(value.toFixed(fractionDigits));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(fractionDigits);
};

const formatPace = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "n/a";
  }

  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainder = totalSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}/km`;
};

const describeActivity = (activity) => {
  const parts = [
    `${activity.dateLocal || "date n/a"} ${activity.name || "Activite sans nom"}`,
    `type ${activity.typeKey || "n/a"}`,
    `distance ${formatValue(activity.distanceKm)} km`,
    `duree ${formatValue(activity.durationMin, 0)} min`,
    `denivele ${formatValue(activity.elevationM, 0)} m`,
    `charge ${formatValue(activity.trainingLoad, 0)}`,
    `fc ${formatValue(activity.averageHr, 0)}/${formatValue(activity.maxHr, 0)}`,
    `allure ${formatPace(activity.paceSecPerKm)}`,
  ];

  if (activity.averageSpeedKmh !== null && activity.averageSpeedKmh !== undefined) {
    parts.push(`vitesse ${formatValue(activity.averageSpeedKmh)} km/h`);
  }

  if (activity.normalizedPower !== null && activity.normalizedPower !== undefined) {
    parts.push(`puissance ${formatValue(activity.normalizedPower, 0)} W`);
  }

  if (activity.averageCadence !== null && activity.averageCadence !== undefined) {
    parts.push(`cadence ${formatValue(activity.averageCadence, 0)}`);
  }

  if (activity.minAvailableStamina !== null && activity.minAvailableStamina !== undefined) {
    parts.push(`stamina mini ${formatValue(activity.minAvailableStamina, 0)}`);
  }

  if (activity.locationName) {
    parts.push(`lieu ${activity.locationName}`);
  }

  return parts.join(", ");
};

const buildPromptData = (payload) => {
  const lines = [];
  const topWeekday = [...(payload.patterns?.weekday || [])].sort(
    (left, right) => right.trainingLoad - left.trainingLoad || right.distanceKm - left.distanceKm
  )[0];
  const topDayPart = [...(payload.patterns?.dayPart || [])].sort(
    (left, right) => right.trainingLoad - left.trainingLoad || right.distanceKm - left.distanceKm
  )[0];

  lines.push("Bloc historique");
  lines.push(
    `Historique total: ${formatValue(payload.overview?.totalActivities, 0)} activites, ${formatValue(payload.overview?.totalDistanceKm)} km, ${formatValue(payload.overview?.totalDurationHours)} h, ${formatValue(payload.overview?.totalElevationM, 0)} m D+, charge ${formatValue(payload.overview?.totalTrainingLoad, 0)}, part outdoor ${formatValue(payload.overview?.outdoorShare, 0)} %.`
  );
  lines.push(
    `Derniers 7 jours: ${formatValue(payload.recent7?.activityCount, 0)} activites, ${formatValue(payload.recent7?.distanceKm)} km, ${formatValue(payload.recent7?.durationHours)} h, ${formatValue(payload.recent7?.elevationM, 0)} m D+, ${formatValue(payload.recent7?.calories, 0)} kcal, charge ${formatValue(payload.recent7?.trainingLoad, 0)}.`
  );
  lines.push(
    `Derniers 28 jours: ${formatValue(payload.recent28?.activityCount, 0)} activites, ${formatValue(payload.recent28?.distanceKm)} km, ${formatValue(payload.recent28?.durationHours)} h, ${formatValue(payload.recent28?.elevationM, 0)} m D+, ${formatValue(payload.recent28?.calories, 0)} kcal, charge ${formatValue(payload.recent28?.trainingLoad, 0)}.`
  );
  lines.push("");
  lines.push("Bloc recuperation");
  lines.push(
    `Recuperation moyenne: FC repos ${formatValue(payload.recovery?.restingHeartRateAvg, 0)}, body battery reveil ${formatValue(payload.recovery?.wakeBodyBatteryAvg, 0)}, sommeil ${formatValue(payload.recovery?.sleepHoursAvg)} h, stress ${formatValue(payload.recovery?.stressAvg, 0)}, pas ${formatValue(payload.recovery?.stepsAvg, 0)}, calories actives ${formatValue(payload.recovery?.activeCaloriesAvg, 0)}, minutes intensite ${formatValue(payload.recovery?.intensityMinutesAvg, 0)}, respiration ${formatValue(payload.recovery?.respirationAvg, 0)}.`
  );
  lines.push(
    `Sommeil recent: score moyen ${formatValue(payload.sleep?.scoreAvg, 0)}, duree moyenne ${formatValue(payload.sleep?.durationAvg)} h, HRV ${formatValue(payload.sleep?.hrvAvg, 0)}, stress nocturne ${formatValue(payload.sleep?.stressAvg, 0)}, besoin de sommeil ${formatValue((payload.sleep?.sleepNeedAvgMinutes || 0) / 60)} h.`
  );

  for (const night of payload.sleep?.recentNights || []) {
    lines.push(
      `Nuit ${night.date}: score ${formatValue(night.score, 0)}, duree ${formatValue(night.durationHours)} h, profond ${formatValue(night.deepHours)} h, REM ${formatValue(night.remHours)} h, eveils ${formatValue(night.awakeMinutes, 0)} min, FC ${formatValue(night.avgHeartRate, 0)}, HRV ${formatValue(night.overnightHrv, 0)}, SpO2 ${formatValue(night.avgSpO2, 0)}, stress ${formatValue(night.avgSleepStress, 0)}, body battery +${formatValue(night.bodyBatteryChange, 0)}, retour ${night.sleepFeedback || "n/a"}, insight ${night.sleepInsight || "n/a"}.`
    );
  }

  lines.push("");
  lines.push("Bloc tendances");
  if (topWeekday) {
    lines.push(
      `Jour le plus charge: ${topWeekday.label} avec ${formatValue(topWeekday.activityCount, 0)} activites, ${formatValue(topWeekday.distanceKm)} km et charge ${formatValue(topWeekday.trainingLoad, 0)}.`
    );
  }
  if (topDayPart) {
    lines.push(
      `Moment le plus charge: ${topDayPart.label} avec ${formatValue(topDayPart.activityCount, 0)} activites, ${formatValue(topDayPart.distanceKm)} km et charge ${formatValue(topDayPart.trainingLoad, 0)}.`
    );
  }
  lines.push(
    `Indoor/outdoor: indoor ${formatValue(payload.patterns?.indoorOutdoor?.indoorCount, 0)} activites pour ${formatValue(payload.patterns?.indoorOutdoor?.indoorDistanceKm)} km, outdoor ${formatValue(payload.patterns?.indoorOutdoor?.outdoorCount, 0)} activites pour ${formatValue(payload.patterns?.indoorOutdoor?.outdoorDistanceKm)} km.`
  );

  for (const location of payload.topLocations || []) {
    lines.push(
      `Lieu fort: ${location.name}, ${formatValue(location.count, 0)} activites, ${formatValue(location.distanceKm)} km, ${formatValue(location.durationHours)} h.`
    );
  }

  lines.push("");
  lines.push("Bloc performance");
  lines.push(
    `VO2max ${formatValue(payload.performance?.vo2Max, 0)}, meilleur 1 km ${formatPace(payload.performance?.best1kSec)}, meilleur 5 km ${formatPace((payload.performance?.best5kSec || 0) / 5)}, meilleur 10 km ${formatPace((payload.performance?.best10kSec || 0) / 10)}.`
  );

  if (payload.performance?.highestTrainingLoad) {
    lines.push(
      `Plus forte charge: ${payload.performance.highestTrainingLoad.date}, ${payload.performance.highestTrainingLoad.name}, type ${payload.performance.highestTrainingLoad.type}, valeur ${formatValue(payload.performance.highestTrainingLoad.value, 0)}.`
    );
  }
  if (payload.performance?.highestSpeed) {
    lines.push(
      `Vitesse max: ${formatValue(payload.performance.highestSpeed.value)} km/h le ${payload.performance.highestSpeed.date} sur ${payload.performance.highestSpeed.name}.`
    );
  }
  if (payload.performance?.highestHeartRate) {
    lines.push(
      `FC max: ${formatValue(payload.performance.highestHeartRate.value, 0)} le ${payload.performance.highestHeartRate.date} sur ${payload.performance.highestHeartRate.name}.`
    );
  }
  if (payload.performance?.highestPower) {
    lines.push(
      `Puissance max: ${formatValue(payload.performance.highestPower.value, 0)} W le ${payload.performance.highestPower.date} sur ${payload.performance.highestPower.name}.`
    );
  }
  if (payload.performance?.lowestStamina) {
    lines.push(
      `Stamina mini: ${formatValue(payload.performance.lowestStamina.value, 0)} le ${payload.performance.lowestStamina.date} sur ${payload.performance.lowestStamina.name}.`
    );
  }

  lines.push("");
  lines.push("Bloc activites recentes");
  for (const activity of payload.recentActivities || []) {
    lines.push(describeActivity(activity));
  }

  return lines.join("\n");
};

const buildPrompt = (payload) => `
Analyse ce bilan Garmin et redige un compte-rendu de forme du jour.

Contraintes strictes:
Tu ecris uniquement 4 a 7 paragraphes courts en francais.
Tu ne dois jamais recopier les donnees source mot pour mot.
Tu n utilises jamais de markdown, jamais de JSON, jamais de puces, jamais de titres.
Tu mentionnes clairement la charge recente, le sommeil, la recuperation, les points forts, les alertes et les activites marquantes.
Si une information manque, tu le dis simplement sans inventer.

Donnees source reformatees:
${buildPromptData(payload)}
`.trim();

const buildCoachSignalsPrompt = (payload) => `
Analyse ces donnees Garmin et retourne STRICTEMENT un objet JSON avec ces cles:
"alert", "advice", "tomorrowWorkout", "fatigueRisk", "focus".

Contraintes:
- "alert": une phrase courte sur le point de vigilance principal.
- "advice": une phrase courte sur l action la plus utile aujourd hui.
- "tomorrowWorkout": une phrase courte avec une seance conseillee demain.
- "fatigueRisk": uniquement "low", "moderate" ou "high".
- "focus": une phrase courte sur la qualite dominante du moment.
- Pas de markdown.
- Pas de texte avant ou apres le JSON.

Donnees source reformatees:
${buildPromptData(payload)}
`.trim();

const stripCodeFences = (value) =>
  String(value || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

const parseCoachSignals = (value) => {
  try {
    const payload = JSON.parse(stripCodeFences(value));
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const fatigueRiskRaw = String(payload.fatigueRisk || "").trim().toLowerCase();
    const fatigueRisk = ["low", "moderate", "high"].includes(fatigueRiskRaw) ? fatigueRiskRaw : null;

    return {
      alert: String(payload.alert || "").trim() || null,
      advice: String(payload.advice || "").trim() || null,
      tomorrowWorkout: String(payload.tomorrowWorkout || "").trim() || null,
      fatigueRisk,
      focus: String(payload.focus || "").trim() || null,
    };
  } catch (_error) {
    return null;
  }
};

const callOllama = async ({ baseUrl, model, prompt, system }) => {
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      system,
      prompt,
      stream: false,
      options: {
        temperature: DEFAULT_TEMPERATURE,
        num_predict: DEFAULT_NUM_PREDICT,
      },
    }),
  });

  const rawBody = await response.text();
  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}: ${rawBody.slice(0, 300)}`);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (_error) {
    throw new Error("Ollama returned an invalid JSON payload.");
  }

  if (!payload || typeof payload.response !== "string" || !payload.response.trim()) {
    throw new Error("Ollama returned an empty response.");
  }

  return payload;
};

const fetchAvailableModels = async (baseUrl) => {
  const response = await fetch(`${baseUrl}/api/tags`, {
    method: "GET",
  });

  const rawBody = await response.text();
  if (!response.ok) {
    throw new Error(`Ollama tags HTTP ${response.status}: ${rawBody.slice(0, 300)}`);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (_error) {
    throw new Error("Ollama tags returned an invalid JSON payload.");
  }

  return Array.isArray(payload?.models)
    ? payload.models
        .map((model) => String(model?.name || "").trim())
        .filter(Boolean)
    : [];
};

const resolveModel = async ({ baseUrl, requestedModel }) => {
  const availableModels = await fetchAvailableModels(baseUrl);
  if (!availableModels.length) {
    if (requestedModel) {
      return {
        model: requestedModel,
        availableModels,
        autoSelected: false,
      };
    }

    throw new Error("No Ollama models are available locally.");
  }

  if (requestedModel) {
    const exactMatch = availableModels.find((model) => model === requestedModel);
    if (exactMatch) {
      return {
        model: exactMatch,
        availableModels,
        autoSelected: false,
      };
    }

    const caseInsensitiveMatch = availableModels.find(
      (model) => model.toLowerCase() === requestedModel.toLowerCase()
    );
    if (caseInsensitiveMatch) {
      return {
        model: caseInsensitiveMatch,
        availableModels,
        autoSelected: false,
      };
    }
  }

  const fallbackModel = PREFERRED_OLLAMA_MODELS.find((model) => availableModels.includes(model)) || availableModels[0];

  return {
    model: fallbackModel,
    availableModels,
    autoSelected: true,
  };
};

const writeOutputs = async ({ exportDir, exportName, model, baseUrl, prompt, ollamaPayload, coachSignals }) => {
  const analysisText = String(ollamaPayload.response || "").trim();
  const generatedAt = new Date().toISOString();
  const jsonPath = path.join(exportDir, "ollama-analysis.json");
  const textPath = path.join(exportDir, "ollama-analysis.txt");

  const jsonPayload = {
    exportName,
    generatedAt,
    model,
    baseUrl,
    promptLength: prompt.length,
    analysisText,
    coachSignals: coachSignals || null,
    totalDuration: ollamaPayload.total_duration ?? null,
    loadDuration: ollamaPayload.load_duration ?? null,
    evalCount: ollamaPayload.eval_count ?? null,
    evalDuration: ollamaPayload.eval_duration ?? null,
  };

  await fs.writeFile(textPath, `${analysisText}\n`, "utf8");
  await fs.writeFile(jsonPath, `${JSON.stringify(jsonPayload, null, 2)}\n`, "utf8");

  return {
    analysisText,
    jsonPath,
    textPath,
  };
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const exportsData = dedupeExports(args.exportsDir);
  if (!exportsData.cacheKey) {
    throw new Error(`No Garmin exports found in ${args.exportsDir}`);
  }

  const exportName = selectLatestExportName(exportsData);
  if (!exportName) {
    throw new Error("Unable to determine the latest Garmin export to analyse.");
  }

  const exportDir = path.join(args.exportsDir, exportName);
  const summary = buildSummary(exportsData);
  const payload = buildAnalysisPayload(summary);
  const prompt = buildPrompt(payload);
  const coachSignalsPrompt = buildCoachSignalsPrompt(payload);

  if (args.dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          model: args.model,
          baseUrl: args.baseUrl,
          exportName,
          exportDir,
          promptLength: prompt.length,
          payload,
        },
        null,
        2
      )
    );
    return;
  }

  const modelState = await resolveModel({
    baseUrl: args.baseUrl,
    requestedModel: args.model,
  });

  const ollamaPayload = await callOllama({
    baseUrl: args.baseUrl,
    model: modelState.model,
    prompt,
    system: ANALYSIS_SYSTEM_PROMPT,
  });

  let coachSignals = null;
  try {
    const coachSignalsPayload = await callOllama({
      baseUrl: args.baseUrl,
      model: modelState.model,
      prompt: coachSignalsPrompt,
      system: COACH_SIGNAL_SYSTEM_PROMPT,
    });
    coachSignals = parseCoachSignals(coachSignalsPayload.response);
  } catch (_error) {
    coachSignals = null;
  }

  const output = await writeOutputs({
    exportDir,
    exportName,
    model: modelState.model,
    baseUrl: args.baseUrl,
    prompt,
    ollamaPayload,
    coachSignals,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        exportName,
        model: modelState.model,
        autoSelectedModel: modelState.autoSelected,
        coachSignals,
        textPath: output.textPath,
        jsonPath: output.jsonPath,
        preview: output.analysisText.slice(0, 220),
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
