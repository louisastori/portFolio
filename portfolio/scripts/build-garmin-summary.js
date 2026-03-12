const fs = require("node:fs");
const path = require("node:path");

const workspaceDir = path.resolve(__dirname, "..", "..");
const exportsDir = path.join(workspaceDir, "garmin crawler", "exports");
const outputFile = path.join(workspaceDir, "portfolio", "assets", "data", "garmin-summary.json");
const outputScriptFile = path.join(workspaceDir, "portfolio", "assets", "data", "garmin-summary.js");

const typeLabels = {
    running: "Course",
    treadmill_running: "Tapis",
    trail_running: "Trail",
    cycling: "Cyclisme",
    road_biking: "Route",
    virtual_ride: "Home trainer",
};

const parseGarminDate = (value) => new Date(value.replace(" ", "T") + "Z");
const toFixedNumber = (value, digits = 1) => Number(value.toFixed(digits));
const sum = (items, pick) => items.reduce((total, item) => total + (pick(item) || 0), 0);
const average = (items, pick) => (items.length ? sum(items, pick) / items.length : 0);
const bestByMax = (items, pick) => items.reduce((best, item) => (!best || pick(item) > pick(best) ? item : best), null);
const bestByMin = (items, pick) => items.reduce((best, item) => (!best || pick(item) < pick(best) ? item : best), null);
const loadJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const formatTypeLabel = (typeKey) => typeLabels[typeKey] || typeKey;

const secondsToMinutes = (seconds) => Math.round((seconds || 0) / 60);

const getIsoWeekKey = (dateValue) => {
    const date = new Date(Date.UTC(dateValue.getUTCFullYear(), dateValue.getUTCMonth(), dateValue.getUTCDate()));
    const dayNumber = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNumber);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
};

const normalizeActivity = (activity, exportName) => ({
    exportName,
    activityId: activity.activityId,
    name: activity.activityName,
    typeKey: activity.activityType?.typeKey || "activity",
    dateLocal: activity.startTimeLocal?.slice(0, 10),
    dateTimeLocal: activity.startTimeLocal,
    dateTimeGmt: activity.startTimeGMT,
    distanceKm: toFixedNumber((activity.distance || 0) / 1000),
    durationMin: secondsToMinutes(activity.duration || 0),
    durationHours: toFixedNumber((activity.duration || 0) / 3600),
    elevationM: Math.round(activity.elevationGain || 0),
    averageHr: Math.round(activity.averageHR || 0),
    maxHr: Math.round(activity.maxHR || 0),
    avgPower: Math.round(activity.avgPower || 0),
    maxPower: Math.round(activity.maxPower || 0),
    vo2Max: activity.vO2MaxValue ?? null,
    trainingEffect: activity.trainingEffectLabel || null,
    trainingLoad: Math.round(activity.activityTrainingLoad || 0),
    paceSecPerKm: activity.distance ? Math.round((activity.duration || 0) / (activity.distance / 1000)) : null,
    fastestSplit1kSec: activity.fastestSplit_1000 ?? null,
    fastestSplit5kSec: activity.fastestSplit_5000 ?? null,
    fastestSplit10kSec: activity.fastestSplit_10000 ?? null,
    calories: Math.round(activity.calories || 0),
    steps: Math.round(activity.steps || 0),
});

const normalizeDaily = (entry, exportName) => ({
    exportName,
    date: entry.calendarDate,
    steps: entry.totalSteps || 0,
    restingHeartRate: entry.restingHeartRate || 0,
    wakeBodyBattery: entry.bodyBatteryAtWakeTime ?? null,
    sleepHours: toFixedNumber((entry.sleepingSeconds || 0) / 3600),
    stress: entry.averageStressLevel || 0,
    activeCalories: entry.activeKilocalories || 0,
    moderateMinutes: entry.moderateIntensityMinutes || 0,
    vigorousMinutes: entry.vigorousIntensityMinutes || 0,
    spo2: entry.averageSpo2 || null,
    floorsAscended: Math.round(entry.floorsAscended || 0),
});

const normalizeSleep = (entry, exportName) => {
    const dto = entry.data?.dailySleepDTO;
    if (!dto) return null;

    return {
        exportName,
        date: dto.calendarDate,
        score: dto.sleepScores?.overall?.value ?? null,
        scoreLabel: dto.sleepScores?.overall?.qualifierKey ?? null,
        durationHours: toFixedNumber((dto.sleepTimeSeconds || 0) / 3600),
        napMinutes: secondsToMinutes(dto.napTimeSeconds || 0),
        deepHours: toFixedNumber((dto.deepSleepSeconds || 0) / 3600),
        lightHours: toFixedNumber((dto.lightSleepSeconds || 0) / 3600),
        remHours: toFixedNumber((dto.remSleepSeconds || 0) / 3600),
        awakeMinutes: secondsToMinutes(dto.awakeSleepSeconds || 0),
        avgHeartRate: dto.avgHeartRate || 0,
        avgSpO2: dto.averageSpO2Value || null,
        avgSleepStress: dto.avgSleepStress || 0,
        overnightHrv: entry.data?.avgOvernightHrv ?? null,
        hrvStatus: entry.data?.hrvStatus ?? null,
        bodyBatteryChange: entry.data?.bodyBatteryChange ?? null,
        avgSkinTempDeviationC: entry.data?.avgSkinTempDeviationC ?? null,
        respirationAverage: dto.averageRespirationValue || null,
    };
};

const dedupeExports = () => {
    const directories = fs
        .readdirSync(exportsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();

    const activityMap = new Map();
    const dailyMap = new Map();
    const sleepMap = new Map();

    let latestActivityExport = null;
    let latestDailyExport = null;
    let latestSleepExport = null;

    for (const exportName of directories) {
        const activityFile = path.join(exportsDir, exportName, "activities.json");
        if (fs.existsSync(activityFile)) {
            latestActivityExport = exportName;
            const payload = loadJson(activityFile);
            for (const activity of payload.data || []) {
                const key = String(activity.activityId);
                const previous = activityMap.get(key);
                if (!previous || exportName > previous.exportName) {
                    activityMap.set(key, normalizeActivity(activity, exportName));
                }
            }
        }

        const dailyFile = path.join(exportsDir, exportName, "daily-summaries.json");
        if (fs.existsSync(dailyFile)) {
            latestDailyExport = exportName;
            const payload = loadJson(dailyFile);
            for (const entry of payload) {
                const data = entry.usersummary?.data;
                if (!data?.calendarDate) continue;
                const key = data.calendarDate;
                const previous = dailyMap.get(key);
                if (!previous || exportName > previous.exportName) {
                    dailyMap.set(key, normalizeDaily(data, exportName));
                }
            }
        }

        const sleepFile = path.join(exportsDir, exportName, "sleep.json");
        if (fs.existsSync(sleepFile)) {
            latestSleepExport = exportName;
            const payload = loadJson(sleepFile);
            for (const entry of payload) {
                const normalized = normalizeSleep(entry, exportName);
                if (!normalized?.date) continue;
                const previous = sleepMap.get(normalized.date);
                if (!previous || exportName > previous.exportName) {
                    sleepMap.set(normalized.date, normalized);
                }
            }
        }
    }

    const activities = [...activityMap.values()].sort(
        (left, right) => parseGarminDate(right.dateTimeGmt) - parseGarminDate(left.dateTimeGmt)
    );
    const daily = [...dailyMap.values()].sort((left, right) => left.date.localeCompare(right.date));
    const sleep = [...sleepMap.values()].sort((left, right) => left.date.localeCompare(right.date));

    return { activities, daily, sleep, latestActivityExport, latestDailyExport, latestSleepExport };
};

const buildSummary = () => {
    const { activities, daily, sleep, latestActivityExport, latestDailyExport, latestSleepExport } = dedupeExports();

    if (!activities.length) {
        throw new Error("No Garmin activities were found in the exports directory.");
    }

    const latestActivity = activities[0];
    const latestActivityDate = latestActivity.dateLocal;
    const latestActivityDateUtc = new Date(`${latestActivityDate}T00:00:00Z`);

    const recent7Activities = activities.filter((activity) => (latestActivityDateUtc - parseGarminDate(activity.dateTimeGmt)) / 86400000 <= 7);
    const recent28Activities = activities.filter((activity) => (latestActivityDateUtc - parseGarminDate(activity.dateTimeGmt)) / 86400000 <= 28);

    const runningActivities = activities.filter((activity) => activity.typeKey.includes("running"));
    const rideActivities = activities.filter((activity) => activity.typeKey.includes("cycl") || activity.typeKey.includes("bik") || activity.typeKey.includes("ride"));

    const longestRun = bestByMax(runningActivities, (activity) => activity.distanceKm);
    const longestRide = bestByMax(rideActivities, (activity) => activity.distanceKm);
    const best1k = bestByMin(runningActivities.filter((activity) => activity.fastestSplit1kSec), (activity) => activity.fastestSplit1kSec);
    const best5k = bestByMin(runningActivities.filter((activity) => activity.fastestSplit5kSec), (activity) => activity.fastestSplit5kSec);
    const best10k = bestByMin(runningActivities.filter((activity) => activity.fastestSplit10kSec), (activity) => activity.fastestSplit10kSec);
    const bestVo2 = bestByMax(runningActivities.filter((activity) => activity.vo2Max), (activity) => activity.vo2Max);
    const highestTrainingLoad = bestByMax(activities.filter((activity) => activity.trainingLoad), (activity) => activity.trainingLoad);

    const fullDailyEntries = daily.filter((entry) => entry.steps > 0 || entry.sleepHours > 0);
    const recentDaily = fullDailyEntries.slice(-7);
    const recentSleep = sleep.slice(-7);

    const weeklyMap = new Map();
    for (const activity of activities) {
        const weekKey = getIsoWeekKey(parseGarminDate(activity.dateTimeGmt));
        const previous = weeklyMap.get(weekKey) || {
            weekKey,
            distanceKm: 0,
            durationHours: 0,
            elevationM: 0,
            activityCount: 0,
        };
        previous.distanceKm += activity.distanceKm;
        previous.durationHours += activity.durationHours;
        previous.elevationM += activity.elevationM;
        previous.activityCount += 1;
        weeklyMap.set(weekKey, previous);
    }

    const weeklyVolume = [...weeklyMap.values()]
        .sort((left, right) => left.weekKey.localeCompare(right.weekKey))
        .slice(-8)
        .map((week) => ({
            ...week,
            distanceKm: toFixedNumber(week.distanceKm),
            durationHours: toFixedNumber(week.durationHours),
            elevationM: Math.round(week.elevationM),
        }));

    const breakdownMap = new Map();
    for (const activity of activities) {
        const key = activity.typeKey;
        const previous = breakdownMap.get(key) || {
            key,
            label: formatTypeLabel(key),
            count: 0,
            distanceKm: 0,
            durationHours: 0,
            elevationM: 0,
        };
        previous.count += 1;
        previous.distanceKm += activity.distanceKm;
        previous.durationHours += activity.durationHours;
        previous.elevationM += activity.elevationM;
        breakdownMap.set(key, previous);
    }

    const breakdown = [...breakdownMap.values()]
        .sort((left, right) => right.distanceKm - left.distanceKm)
        .map((item) => ({
            ...item,
            distanceKm: toFixedNumber(item.distanceKm),
            durationHours: toFixedNumber(item.durationHours),
            elevationM: Math.round(item.elevationM),
        }));

    return {
        generatedAt: new Date().toISOString(),
        source: {
            latestActivityExport,
            latestDailyExport,
            latestSleepExport,
            latestActivityDate,
            activityCount: activities.length,
            dailyCount: fullDailyEntries.length,
            sleepCount: sleep.length,
        },
        overview: {
            totalActivities: activities.length,
            totalRunningActivities: runningActivities.length,
            totalRideActivities: rideActivities.length,
        },
        recent7: {
            distanceKm: toFixedNumber(sum(recent7Activities, (activity) => activity.distanceKm)),
            durationHours: toFixedNumber(sum(recent7Activities, (activity) => activity.durationHours)),
            elevationM: Math.round(sum(recent7Activities, (activity) => activity.elevationM)),
            activityCount: recent7Activities.length,
        },
        recent28: {
            distanceKm: toFixedNumber(sum(recent28Activities, (activity) => activity.distanceKm)),
            durationHours: toFixedNumber(sum(recent28Activities, (activity) => activity.durationHours)),
            elevationM: Math.round(sum(recent28Activities, (activity) => activity.elevationM)),
            activityCount: recent28Activities.length,
        },
        longestRun,
        longestRide,
        performance: {
            vo2Max: bestVo2?.vo2Max ?? null,
            best1kSec: best1k?.fastestSplit1kSec ?? null,
            best1kDate: best1k?.dateLocal ?? null,
            best5kSec: best5k?.fastestSplit5kSec ?? null,
            best5kDate: best5k?.dateLocal ?? null,
            best10kSec: best10k?.fastestSplit10kSec ?? null,
            best10kDate: best10k?.dateLocal ?? null,
            highestTrainingLoad: highestTrainingLoad
                ? {
                      value: highestTrainingLoad.trainingLoad,
                      date: highestTrainingLoad.dateLocal,
                      name: highestTrainingLoad.name,
                      type: highestTrainingLoad.typeKey,
                  }
                : null,
        },
        recovery: {
            restingHeartRateAvg: Math.round(average(recentDaily, (entry) => entry.restingHeartRate)),
            wakeBodyBatteryAvg: Math.round(average(recentDaily.filter((entry) => entry.wakeBodyBattery != null), (entry) => entry.wakeBodyBattery)),
            sleepHoursAvg: toFixedNumber(average(recentDaily, (entry) => entry.sleepHours)),
            stepsAvg: Math.round(average(recentDaily, (entry) => entry.steps)),
            stressAvg: Math.round(average(recentDaily, (entry) => entry.stress)),
        },
        sleep: {
            scoreAvg: Math.round(average(recentSleep.filter((entry) => entry.score != null), (entry) => entry.score)),
            durationAvg: toFixedNumber(average(recentSleep, (entry) => entry.durationHours)),
            hrvAvg: Math.round(average(recentSleep.filter((entry) => entry.overnightHrv != null), (entry) => entry.overnightHrv)),
            stressAvg: Math.round(average(recentSleep, (entry) => entry.avgSleepStress)),
            recentNights: recentSleep.map((entry) => ({
                date: entry.date,
                score: entry.score,
                scoreLabel: entry.scoreLabel,
                durationHours: entry.durationHours,
                deepHours: entry.deepHours,
                lightHours: entry.lightHours,
                remHours: entry.remHours,
                napMinutes: entry.napMinutes,
                avgHeartRate: entry.avgHeartRate,
                avgSpO2: entry.avgSpO2,
                avgSleepStress: entry.avgSleepStress,
                overnightHrv: entry.overnightHrv,
                hrvStatus: entry.hrvStatus,
                bodyBatteryChange: entry.bodyBatteryChange,
                respirationAverage: entry.respirationAverage,
            })),
        },
        breakdown,
        weeklyVolume,
        dailyHistory: recentDaily,
        recentActivities: activities.slice(0, 8),
    };
};

const summary = buildSummary();
fs.writeFileSync(outputFile, JSON.stringify(summary, null, 2) + "\n", "utf8");
fs.writeFileSync(outputScriptFile, `window.__GARMIN_SUMMARY__ = ${JSON.stringify(summary, null, 2)};\n`, "utf8");
console.log(`Garmin summary written to ${outputFile}`);
