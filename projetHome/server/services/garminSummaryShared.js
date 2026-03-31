const fs = require("node:fs");
const path = require("node:path");

const typeLabels = {
  running: "Course",
  treadmill_running: "Tapis",
  trail_running: "Trail",
  cycling: "Cyclisme",
  road_biking: "Route",
  virtual_ride: "Home trainer",
};

const weekdayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const dayPartLabels = [
  { key: "night", label: "Nuit", start: 0, end: 5 },
  { key: "morning", label: "Matin", start: 5, end: 12 },
  { key: "afternoon", label: "Apres-midi", start: 12, end: 18 },
  { key: "evening", label: "Soir", start: 18, end: 24 },
];

const parseGarminDate = (value) => new Date(String(value).replace(" ", "T") + "Z");
const toFixedNumber = (value, digits = 1) => Number(Number(value || 0).toFixed(digits));
const toNullableFixedNumber = (value, digits = 1) =>
  value === null || value === undefined || Number.isNaN(Number(value)) ? null : Number(Number(value).toFixed(digits));
const sum = (items, pick) => items.reduce((total, item) => total + (pick(item) || 0), 0);
const average = (items, pick) => (items.length ? sum(items, pick) / items.length : 0);
const bestByMax = (items, pick) => items.reduce((best, item) => (!best || pick(item) > pick(best) ? item : best), null);
const bestByMin = (items, pick) => items.reduce((best, item) => (!best || pick(item) < pick(best) ? item : best), null);
const loadJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const secondsToMinutes = (seconds) => Math.round((seconds || 0) / 60);
const hoursFromSeconds = (seconds) => toFixedNumber((seconds || 0) / 3600);
const speedToKmh = (metersPerSecond) => toNullableFixedNumber(Number(metersPerSecond || 0) * 3.6);
const formatTypeLabel = (typeKey) => typeLabels[typeKey] || typeKey || "Activite";
const hasCoords = (activity) =>
  activity &&
  activity.startLatitude !== null &&
  activity.startLatitude !== undefined &&
  activity.startLongitude !== null &&
  activity.startLongitude !== undefined;

const getIsoWeekKey = (dateValue) => {
  const date = new Date(Date.UTC(dateValue.getUTCFullYear(), dateValue.getUTCMonth(), dateValue.getUTCDate()));
  const dayNumber = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
};

const addDays = (dateString, offset) => {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};

const buildDateRange = (endDateString, dayCount) =>
  Array.from({ length: dayCount }, (_item, index) => addDays(endDateString, index - dayCount + 1));

const normalizeSplitType = (value) => {
  const type = String(value || "segment");
  if (type.includes("WARMUP")) return { key: "warmup", label: "Echauffement" };
  if (type.includes("RECOVERY")) return { key: "recovery", label: "Recup" };
  if (type.includes("COOLDOWN")) return { key: "cooldown", label: "Retour au calme" };
  if (type.includes("INTERVAL")) return { key: "work", label: "Intervalle" };
  if (type.includes("CLIMB")) return { key: "climb", label: "Cote" };
  if (type.includes("LAP")) return { key: "lap", label: "Tour" };
  return { key: "steady", label: formatTypeLabel(type.toLowerCase()) };
};

const maybeReverseSplits = (splits) => {
  if (!splits.length) return splits;
  const first = String(splits[0].splitType || "");
  const last = String(splits[splits.length - 1].splitType || "");
  return first.includes("COOLDOWN") && last.includes("WARMUP") ? splits.slice().reverse() : splits;
};

const summarizeSplits = (rawSplits) => {
  const orderedSplits = maybeReverseSplits(rawSplits || []);
  const preview = orderedSplits.slice(0, 8).map((split) => {
    const normalized = normalizeSplitType(split.splitType);
    return {
      key: normalized.key,
      label: normalized.label,
      rawType: split.splitType || null,
      distanceKm: toFixedNumber((split.distance || 0) / 1000, 2),
      durationMin: secondsToMinutes(split.duration || 0),
      averageSpeedKmh: speedToKmh(split.averageSpeed),
      averageMovingSpeedKmh: speedToKmh(split.averageMovingSpeed),
      averageHr: Math.round(split.averageHR || 0),
      averagePower: Math.round(split.averagePower || 0),
      averageCadence: Math.round(split.averageRunCadence || split.averageBikeCadence || split.avgStepFrequency || 0),
    };
  });

  const counts = orderedSplits.reduce((accumulator, split) => {
    const normalized = normalizeSplitType(split.splitType);
    accumulator[normalized.key] = (accumulator[normalized.key] || 0) + 1;
    return accumulator;
  }, {});

  return {
    count: orderedSplits.length,
    preview,
    counts,
    maxSplitSpeedKmh: bestByMax(preview.filter((split) => split.averageSpeedKmh), (split) => split.averageSpeedKmh)?.averageSpeedKmh ?? null,
    maxSplitPower: bestByMax(preview.filter((split) => split.averagePower), (split) => split.averagePower)?.averagePower ?? null,
  };
};

const mergePreferDefined = (base, extra) => {
  const merged = { ...base };
  Object.entries(extra || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      merged[key] = value;
    }
  });
  return merged;
};

const normalizeActivity = (activity, exportName) => ({
  exportName,
  activityId: activity.activityId,
  name: activity.activityName,
  typeKey: activity.activityType?.typeKey || "activity",
  dateLocal: activity.startTimeLocal ? activity.startTimeLocal.slice(0, 10) : null,
  dateTimeLocal: activity.startTimeLocal,
  dateTimeGmt: activity.startTimeGMT,
  distanceKm: toFixedNumber((activity.distance || 0) / 1000),
  durationMin: secondsToMinutes(activity.duration || 0),
  durationHours: hoursFromSeconds(activity.duration || 0),
  elevationM: Math.round(activity.elevationGain || 0),
  elevationLossM: Math.round(activity.elevationLoss || 0),
  averageHr: Math.round(activity.averageHR || 0),
  maxHr: Math.round(activity.maxHR || 0),
  avgPower: Math.round(activity.avgPower || 0),
  maxPower: Math.round(activity.maxPower || 0),
  normalizedPower: Math.round(activity.normPower || 0),
  vo2Max: activity.vO2MaxValue ?? null,
  trainingEffect: activity.trainingEffectLabel || null,
  trainingLoad: Math.round(activity.activityTrainingLoad || 0),
  paceSecPerKm: activity.distance ? Math.round((activity.duration || 0) / (activity.distance / 1000)) : null,
  fastestSplit1kSec: activity.fastestSplit_1000 ?? null,
  fastestSplit5kSec: activity.fastestSplit_5000 ?? null,
  fastestSplit10kSec: activity.fastestSplit_10000 ?? null,
  calories: Math.round(activity.calories || 0),
  steps: Math.round(activity.steps || 0),
  locationName: activity.locationName || null,
  startLatitude: activity.startLatitude ?? null,
  startLongitude: activity.startLongitude ?? null,
  aerobicTrainingEffect: toNullableFixedNumber(activity.aerobicTrainingEffect),
  anaerobicTrainingEffect: toNullableFixedNumber(activity.anaerobicTrainingEffect),
  strideLengthCm: toNullableFixedNumber(activity.avgStrideLength),
  differenceBodyBattery: activity.differenceBodyBattery ?? null,
});

const normalizeActivityDetail = (entry, exportName) => {
  const data = entry.data || {};
  const summary = data.summaryDTO || {};
  const splitSummary = summarizeSplits(data.splitSummaries || []);
  const cadenceAverage = summary.averageRunCadence ?? summary.averageBikeCadence ?? null;
  const cadenceMax = summary.maxRunCadence ?? summary.maxBikeCadence ?? null;
  const distanceMeters = summary.distance || 0;
  const durationSeconds = summary.duration || 0;
  const outdoor = summary.startLatitude !== null && summary.startLatitude !== undefined;

  return {
    exportName,
    activityId: data.activityId || entry.activityId,
    name: data.activityName || null,
    typeKey: data.activityTypeDTO?.typeKey || null,
    dateLocal: summary.startTimeLocal ? summary.startTimeLocal.slice(0, 10) : null,
    dateTimeLocal: summary.startTimeLocal || null,
    dateTimeGmt: summary.startTimeGMT || null,
    distanceKm: toFixedNumber(distanceMeters / 1000),
    durationMin: secondsToMinutes(durationSeconds),
    durationHours: hoursFromSeconds(durationSeconds),
    movingDurationMin: secondsToMinutes(summary.movingDuration || 0),
    movingDurationHours: hoursFromSeconds(summary.movingDuration || 0),
    elapsedDurationMin: secondsToMinutes(summary.elapsedDuration || 0),
    elevationM: Math.round(summary.elevationGain || 0),
    elevationLossM: Math.round(summary.elevationLoss || 0),
    maxElevationM: toNullableFixedNumber(summary.maxElevation),
    minElevationM: toNullableFixedNumber(summary.minElevation),
    avgElevationM: toNullableFixedNumber(summary.avgElevation),
    averageHr: Math.round(summary.averageHR || 0),
    maxHr: Math.round(summary.maxHR || 0),
    minHr: Math.round(summary.minHR || 0),
    avgPower: Math.round(summary.averagePower || 0),
    maxPower: Math.round(summary.maxPower || 0),
    normalizedPower: Math.round(summary.normalizedPower || 0),
    averageCadence: cadenceAverage === null || cadenceAverage === undefined ? null : Math.round(cadenceAverage),
    maxCadence: cadenceMax === null || cadenceMax === undefined ? null : Math.round(cadenceMax),
    strideLengthCm: toNullableFixedNumber(summary.strideLength),
    groundContactTimeMs: toNullableFixedNumber(summary.groundContactTime),
    verticalOscillationCm: toNullableFixedNumber(summary.verticalOscillation),
    verticalRatioPct: toNullableFixedNumber(summary.verticalRatio),
    averageSpeedKmh: speedToKmh(summary.averageSpeed),
    movingSpeedKmh: speedToKmh(summary.averageMovingSpeed),
    maxSpeedKmh: speedToKmh(summary.maxSpeed),
    calories: Math.round(summary.calories || 0),
    steps: Math.round(summary.steps || 0),
    trainingEffect: summary.trainingEffectLabel || null,
    trainingLoad: Math.round(summary.activityTrainingLoad || 0),
    paceSecPerKm: distanceMeters ? Math.round(durationSeconds / (distanceMeters / 1000)) : null,
    locationName: data.locationName || null,
    startLatitude: summary.startLatitude ?? null,
    startLongitude: summary.startLongitude ?? null,
    endLatitude: summary.endLatitude ?? null,
    endLongitude: summary.endLongitude ?? null,
    averageTemperatureC: toNullableFixedNumber(summary.averageTemperature),
    maxTemperatureC: toNullableFixedNumber(summary.maxTemperature),
    minTemperatureC: toNullableFixedNumber(summary.minTemperature),
    waterEstimatedMl: Math.round(summary.waterEstimated || 0),
    recoveryHeartRate: Math.round(summary.recoveryHeartRate || 0),
    moderateMinutes: Math.round(summary.moderateIntensityMinutes || 0),
    vigorousMinutes: Math.round(summary.vigorousIntensityMinutes || 0),
    beginPotentialStamina: toNullableFixedNumber(summary.beginPotentialStamina, 0),
    endPotentialStamina: toNullableFixedNumber(summary.endPotentialStamina, 0),
    minAvailableStamina: toNullableFixedNumber(summary.minAvailableStamina, 0),
    differenceBodyBattery: toNullableFixedNumber(summary.differenceBodyBattery, 0),
    aerobicTrainingEffect: toNullableFixedNumber(summary.aerobicTrainingEffect),
    anaerobicTrainingEffect: toNullableFixedNumber(summary.anaerobicTrainingEffect),
    splitCount: splitSummary.count,
    splitCounts: splitSummary.counts,
    splitPreview: splitSummary.preview,
    maxSplitSpeedKmh: splitSummary.maxSplitSpeedKmh,
    maxSplitPower: splitSummary.maxSplitPower,
    isOutdoor: outdoor,
    hasCoordinates: outdoor,
  };
};

const normalizeDaily = (entry, exportName) => ({
  exportName,
  date: entry.calendarDate,
  steps: entry.totalSteps || 0,
  totalDistanceKm: toFixedNumber((entry.totalDistanceMeters || 0) / 1000),
  wellnessDistanceKm: toFixedNumber((entry.wellnessDistanceMeters || 0) / 1000),
  restingHeartRate: entry.restingHeartRate || 0,
  wakeBodyBattery: entry.bodyBatteryAtWakeTime ?? null,
  bodyBatteryHighest: entry.bodyBatteryHighestValue ?? null,
  bodyBatteryLowest: entry.bodyBatteryLowestValue ?? null,
  bodyBatteryMostRecent: entry.bodyBatteryMostRecentValue ?? null,
  bodyBatteryCharged: entry.bodyBatteryChargedValue ?? null,
  bodyBatteryDrained: entry.bodyBatteryDrainedValue ?? null,
  bodyBatteryDuringSleep: entry.bodyBatteryDuringSleep ?? null,
  sleepHours: toFixedNumber((entry.sleepingSeconds || 0) / 3600),
  stress: entry.averageStressLevel || 0,
  activeCalories: entry.activeKilocalories || 0,
  totalCalories: entry.totalKilocalories || 0,
  moderateMinutes: entry.moderateIntensityMinutes || 0,
  vigorousMinutes: entry.vigorousIntensityMinutes || 0,
  spo2: entry.averageSpo2 || null,
  floorsAscended: Math.round(entry.floorsAscended || 0),
  avgWakingRespiration: entry.avgWakingRespirationValue ?? null,
  activeSeconds: secondsToMinutes(entry.activeSeconds || 0),
  highlyActiveSeconds: secondsToMinutes(entry.highlyActiveSeconds || 0),
  sedentarySeconds: secondsToMinutes(entry.sedentarySeconds || 0),
});

const normalizeSleep = (entry, exportName) => {
  const data = entry.data || {};
  const dto = data.dailySleepDTO;
  if (!dto) return null;

  return {
    exportName,
    date: dto.calendarDate,
    sleepStartTimestampGmt: dto.sleepStartTimestampGMT ?? null,
    sleepEndTimestampGmt: dto.sleepEndTimestampGMT ?? null,
    sleepStartTimestampLocal: dto.sleepStartTimestampLocal ?? null,
    sleepEndTimestampLocal: dto.sleepEndTimestampLocal ?? null,
    score: dto.sleepScores?.overall?.value ?? null,
    scoreLabel: dto.sleepScores?.overall?.qualifierKey ?? null,
    durationHours: toFixedNumber((dto.sleepTimeSeconds || 0) / 3600),
    napMinutes: secondsToMinutes(dto.napTimeSeconds || 0),
    deepHours: toFixedNumber((dto.deepSleepSeconds || 0) / 3600),
    lightHours: toFixedNumber((dto.lightSleepSeconds || 0) / 3600),
    remHours: toFixedNumber((dto.remSleepSeconds || 0) / 3600),
    awakeMinutes: secondsToMinutes(dto.awakeSleepSeconds || 0),
    avgHeartRate: dto.avgHeartRate || 0,
    avgSpO2: dto.averageSpO2Value ?? null,
    avgSleepStress: dto.avgSleepStress || 0,
    overnightHrv: data.avgOvernightHrv ?? null,
    hrvStatus: data.hrvStatus ?? null,
    bodyBatteryChange: data.bodyBatteryChange ?? null,
    respirationAverage: dto.averageRespirationValue ?? null,
    restlessMomentsCount: data.restlessMomentsCount ?? null,
    avgSkinTempDeviationC: data.avgSkinTempDeviationC ?? null,
    sleepNeedActualMinutes: dto.sleepNeed?.actual ?? null,
    nextSleepNeedActualMinutes: dto.nextSleepNeed?.actual ?? null,
    sleepFeedback: dto.sleepScoreFeedback || null,
    sleepInsight: dto.sleepScoreInsight || null,
  };
};

const getExportsDir = (config) => path.join(path.resolve(config.rootDir, ".."), "garmin crawler", "exports");

const dedupeExports = (exportsDir) => {
  const directories = fs
    .readdirSync(exportsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const activityMap = new Map();
  const activityDetailMap = new Map();
  const dailyMap = new Map();
  const sleepMap = new Map();
  let latestActivityExport = null;
  let latestActivityDetailExport = null;
  let latestDailyExport = null;
  let latestSleepExport = null;

  directories.forEach((exportName) => {
    const exportDir = path.join(exportsDir, exportName);
    const activityFile = path.join(exportDir, "activities.json");
    const detailFile = path.join(exportDir, "activity-details.json");
    const dailyFile = path.join(exportDir, "daily-summaries.json");
    const sleepFile = path.join(exportDir, "sleep.json");

    if (fs.existsSync(activityFile)) {
      latestActivityExport = exportName;
      (loadJson(activityFile).data || []).forEach((activity) => {
        const key = String(activity.activityId);
        const previous = activityMap.get(key);
        if (!previous || exportName > previous.exportName) {
          activityMap.set(key, normalizeActivity(activity, exportName));
        }
      });
    }

    if (fs.existsSync(detailFile)) {
      latestActivityDetailExport = exportName;
      loadJson(detailFile).forEach((entry) => {
        const detail = normalizeActivityDetail(entry, exportName);
        if (!detail.activityId) return;
        const key = String(detail.activityId);
        const previous = activityDetailMap.get(key);
        if (!previous || exportName > previous.exportName) {
          activityDetailMap.set(key, detail);
        }
      });
    }

    if (fs.existsSync(dailyFile)) {
      latestDailyExport = exportName;
      loadJson(dailyFile).forEach((entry) => {
        const data = entry.usersummary?.data;
        if (!data?.calendarDate) return;
        const previous = dailyMap.get(data.calendarDate);
        if (!previous || exportName > previous.exportName) {
          dailyMap.set(data.calendarDate, normalizeDaily(data, exportName));
        }
      });
    }

    if (fs.existsSync(sleepFile)) {
      latestSleepExport = exportName;
      loadJson(sleepFile).forEach((entry) => {
        const normalized = normalizeSleep(entry, exportName);
        if (!normalized?.date) return;
        const previous = sleepMap.get(normalized.date);
        if (!previous || exportName > previous.exportName) {
          sleepMap.set(normalized.date, normalized);
        }
      });
    }
  });

  const activityIds = new Set([...activityMap.keys(), ...activityDetailMap.keys()]);
  const activities = [...activityIds]
    .map((activityId) => mergePreferDefined(activityMap.get(activityId) || { activityId: Number(activityId) }, activityDetailMap.get(activityId)))
    .sort((left, right) => parseGarminDate(right.dateTimeGmt) - parseGarminDate(left.dateTimeGmt));

  return {
    activities,
    daily: [...dailyMap.values()].sort((left, right) => left.date.localeCompare(right.date)),
    sleep: [...sleepMap.values()].sort((left, right) => left.date.localeCompare(right.date)),
    latestActivityExport,
    latestActivityDetailExport,
    latestDailyExport,
    latestSleepExport,
    cacheKey: directories.join("|"),
  };
};

module.exports = {
  average,
  bestByMax,
  bestByMin,
  buildDateRange,
  dayPartLabels,
  dedupeExports,
  formatTypeLabel,
  getExportsDir,
  getIsoWeekKey,
  hasCoords,
  parseGarminDate,
  sum,
  toFixedNumber,
  weekdayLabels,
};
