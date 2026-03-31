const {
  average,
  bestByMax,
  bestByMin,
  buildDateRange,
  dayPartLabels,
  formatTypeLabel,
  getIsoWeekKey,
  hasCoords,
  parseGarminDate,
  sum,
  toFixedNumber,
  weekdayLabels,
} = require("./garminSummaryShared");

const summarizeActivityWindow = (activities) => ({
  distanceKm: toFixedNumber(sum(activities, (activity) => activity.distanceKm)),
  durationHours: toFixedNumber(sum(activities, (activity) => activity.durationHours)),
  elevationM: Math.round(sum(activities, (activity) => activity.elevationM)),
  calories: Math.round(sum(activities, (activity) => activity.calories)),
  trainingLoad: Math.round(sum(activities, (activity) => activity.trainingLoad)),
  activityCount: activities.length,
});

const cardioZoneDefinitions = [
  { key: "z1", label: "Z1", min: 0, max: 129 },
  { key: "z2", label: "Z2", min: 130, max: 144 },
  { key: "z3", label: "Z3", min: 145, max: 159 },
  { key: "z4", label: "Z4", min: 160, max: 174 },
  { key: "z5", label: "Z5", min: 175, max: Infinity },
];

const powerZoneDefinitions = [
  { key: "z1", label: "Z1", min: 0, max: 149 },
  { key: "z2", label: "Z2", min: 150, max: 199 },
  { key: "z3", label: "Z3", min: 200, max: 249 },
  { key: "z4", label: "Z4", min: 250, max: 299 },
  { key: "z5", label: "Z5", min: 300, max: Infinity },
];

const bucketAverageMetric = (activities, definitions, selector) => {
  const buckets = definitions.map((definition) => ({
    ...definition,
    durationHours: 0,
    trainingLoad: 0,
    activityCount: 0,
  }));

  activities.forEach((activity) => {
    const value = Number(selector(activity) || 0);
    if (!value) {
      return;
    }

    const bucket =
      buckets.find((item) => value >= item.min && value <= item.max) ||
      buckets[buckets.length - 1];
    bucket.durationHours += activity.durationHours || 0;
    bucket.trainingLoad += activity.trainingLoad || 0;
    bucket.activityCount += 1;
  });

  const totalDuration = Math.max(
    buckets.reduce((sumValue, bucket) => sumValue + bucket.durationHours, 0),
    0.0001
  );

  return buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    durationHours: toFixedNumber(bucket.durationHours),
    trainingLoad: Math.round(bucket.trainingLoad),
    activityCount: bucket.activityCount,
    sharePct: Math.round((bucket.durationHours / totalDuration) * 100),
  }));
};

const formatClock = (seconds) => {
  if (!Number.isFinite(seconds)) {
    return "--";
  }

  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remain = total % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`
    : `${minutes}:${String(remain).padStart(2, "0")}`;
};

const buildSummary = (exportsData) => {
  const activities = exportsData.activities;
  const daily = exportsData.daily;
  const sleep = exportsData.sleep;

  if (!activities.length) {
    throw new Error("No Garmin activities were found in local exports.");
  }

  const latestActivity = activities[0];
  const latestActivityDate = latestActivity.dateLocal;
  const latestActivityDateUtc = new Date(`${latestActivityDate}T00:00:00Z`);

  const recent7Activities = activities.filter(
    (activity) => (latestActivityDateUtc - parseGarminDate(activity.dateTimeGmt)) / 86400000 <= 7
  );
  const recent28Activities = activities.filter(
    (activity) => (latestActivityDateUtc - parseGarminDate(activity.dateTimeGmt)) / 86400000 <= 28
  );
  const runningActivities = activities.filter((activity) => String(activity.typeKey || "").includes("running"));
  const rideActivities = activities.filter((activity) => {
    const typeKey = String(activity.typeKey || "");
    return typeKey.includes("cycl") || typeKey.includes("bik") || typeKey.includes("ride");
  });
  const outdoorActivities = activities.filter((activity) => hasCoords(activity));
  const indoorActivities = activities.filter((activity) => !hasCoords(activity));

  const longestRun = bestByMax(runningActivities, (activity) => activity.distanceKm);
  const longestRide = bestByMax(rideActivities, (activity) => activity.distanceKm);
  const best1k = bestByMin(runningActivities.filter((activity) => activity.fastestSplit1kSec), (activity) => activity.fastestSplit1kSec);
  const best5k = bestByMin(runningActivities.filter((activity) => activity.fastestSplit5kSec), (activity) => activity.fastestSplit5kSec);
  const best10k = bestByMin(runningActivities.filter((activity) => activity.fastestSplit10kSec), (activity) => activity.fastestSplit10kSec);
  const bestVo2 = bestByMax(runningActivities.filter((activity) => activity.vo2Max), (activity) => activity.vo2Max);
  const highestTrainingLoad = bestByMax(activities.filter((activity) => activity.trainingLoad), (activity) => activity.trainingLoad);
  const highestSpeed = bestByMax(activities.filter((activity) => activity.maxSpeedKmh), (activity) => activity.maxSpeedKmh);
  const highestHeartRate = bestByMax(activities.filter((activity) => activity.maxHr), (activity) => activity.maxHr);
  const highestPower = bestByMax(
    activities.filter((activity) => activity.maxPower || activity.normalizedPower),
    (activity) => activity.maxPower || activity.normalizedPower
  );
  const lowestStamina = bestByMin(
    activities.filter((activity) => activity.minAvailableStamina !== null && activity.minAvailableStamina !== undefined),
    (activity) => activity.minAvailableStamina
  );

  const fullDailyEntries = daily.filter((entry) => entry.steps > 0 || entry.sleepHours > 0);
  const recentDaily = fullDailyEntries.slice(-14);
  const recentSleep = sleep.slice(-7);
  const cardioZones = bucketAverageMetric(
    activities.filter((activity) => activity.averageHr),
    cardioZoneDefinitions,
    (activity) => activity.averageHr
  );
  const powerZones = bucketAverageMetric(
    activities.filter((activity) => activity.normalizedPower || activity.avgPower),
    powerZoneDefinitions,
    (activity) => activity.normalizedPower || activity.avgPower
  );
  const activityFrequencyByHour = Array.from({ length: 24 }, (_value, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}h`,
    activityCount: 0,
    trainingLoad: 0,
    distanceKm: 0,
  }));
  const recordTimelineEvents = [];

  const weeklyMap = new Map();
  const breakdownMap = new Map();
  const trainingByDate = new Map();
  const locationMap = new Map();
  const weekdayMap = new Map(
    weekdayLabels.map((label, index) => [index, { index, label, activityCount: 0, distanceKm: 0, durationHours: 0, trainingLoad: 0 }])
  );
  const dayPartMap = new Map(dayPartLabels.map((item) => [item.key, { key: item.key, label: item.label, activityCount: 0, distanceKm: 0, trainingLoad: 0 }]));

  activities.forEach((activity) => {
    const weekKey = getIsoWeekKey(parseGarminDate(activity.dateTimeGmt));
    const weekly = weeklyMap.get(weekKey) || {
      weekKey,
      distanceKm: 0,
      durationHours: 0,
      elevationM: 0,
      calories: 0,
      trainingLoad: 0,
      activityCount: 0,
    };
    weekly.distanceKm += activity.distanceKm || 0;
    weekly.durationHours += activity.durationHours || 0;
    weekly.elevationM += activity.elevationM || 0;
    weekly.calories += activity.calories || 0;
    weekly.trainingLoad += activity.trainingLoad || 0;
    weekly.activityCount += 1;
    weeklyMap.set(weekKey, weekly);

    const breakdown = breakdownMap.get(activity.typeKey) || {
      key: activity.typeKey,
      label: formatTypeLabel(activity.typeKey),
      count: 0,
      distanceKm: 0,
      durationHours: 0,
      elevationM: 0,
      trainingLoad: 0,
      indoorCount: 0,
      outdoorCount: 0,
    };
    breakdown.count += 1;
    breakdown.distanceKm += activity.distanceKm || 0;
    breakdown.durationHours += activity.durationHours || 0;
    breakdown.elevationM += activity.elevationM || 0;
    breakdown.trainingLoad += activity.trainingLoad || 0;
    if (hasCoords(activity)) {
      breakdown.outdoorCount += 1;
    } else {
      breakdown.indoorCount += 1;
    }
    breakdownMap.set(activity.typeKey, breakdown);

    if (activity.dateLocal) {
      const day = trainingByDate.get(activity.dateLocal) || {
        date: activity.dateLocal,
        distanceKm: 0,
        durationHours: 0,
        elevationM: 0,
        trainingLoad: 0,
        calories: 0,
        activityCount: 0,
      };
      day.distanceKm += activity.distanceKm || 0;
      day.durationHours += activity.durationHours || 0;
      day.elevationM += activity.elevationM || 0;
      day.trainingLoad += activity.trainingLoad || 0;
      day.calories += activity.calories || 0;
      day.activityCount += 1;
      trainingByDate.set(activity.dateLocal, day);
    }

    if (hasCoords(activity)) {
      const locationKey = activity.locationName || `${toFixedNumber(activity.startLatitude, 2)},${toFixedNumber(activity.startLongitude, 2)}`;
      const location = locationMap.get(locationKey) || { name: locationKey, count: 0, distanceKm: 0, durationHours: 0 };
      location.count += 1;
      location.distanceKm += activity.distanceKm || 0;
      location.durationHours += activity.durationHours || 0;
      locationMap.set(locationKey, location);
    }

    const dayIndex = (parseGarminDate(activity.dateTimeGmt).getUTCDay() + 6) % 7;
    const weekday = weekdayMap.get(dayIndex);
    weekday.activityCount += 1;
    weekday.distanceKm += activity.distanceKm || 0;
    weekday.durationHours += activity.durationHours || 0;
    weekday.trainingLoad += activity.trainingLoad || 0;

    const localDate = activity.dateTimeLocal || activity.dateTimeGmt;
    const hour = localDate ? Number(String(localDate).slice(11, 13)) : 0;
    const dayPartMeta = dayPartLabels.find((item) => hour >= item.start && hour < item.end) || dayPartLabels[0];
    const dayPart = dayPartMap.get(dayPartMeta.key);
    dayPart.activityCount += 1;
    dayPart.distanceKm += activity.distanceKm || 0;
    dayPart.trainingLoad += activity.trainingLoad || 0;

    const hourBucket = activityFrequencyByHour[hour] || activityFrequencyByHour[0];
    hourBucket.activityCount += 1;
    hourBucket.trainingLoad += activity.trainingLoad || 0;
    hourBucket.distanceKm += activity.distanceKm || 0;
  });

  if (best1k) {
    recordTimelineEvents.push({
      label: "1 km",
      date: best1k.dateLocal,
      value: formatClock(best1k.fastestSplit1kSec),
      note: best1k.name,
      tone: "cyan",
    });
  }
  if (best5k) {
    recordTimelineEvents.push({
      label: "5 km",
      date: best5k.dateLocal,
      value: formatClock(best5k.fastestSplit5kSec),
      note: best5k.name,
      tone: "purple",
    });
  }
  if (best10k) {
    recordTimelineEvents.push({
      label: "10 km",
      date: best10k.dateLocal,
      value: formatClock(best10k.fastestSplit10kSec),
      note: best10k.name,
      tone: "pink",
    });
  }
  if (highestTrainingLoad) {
    recordTimelineEvents.push({
      label: "Charge max",
      date: highestTrainingLoad.dateLocal,
      value: `${highestTrainingLoad.trainingLoad}`,
      note: highestTrainingLoad.name,
      tone: "gold",
    });
  }
  if (highestSpeed) {
    recordTimelineEvents.push({
      label: "Vitesse max",
      date: highestSpeed.dateLocal,
      value: `${toFixedNumber(highestSpeed.maxSpeedKmh)} km/h`,
      note: highestSpeed.name,
      tone: "cyan",
    });
  }
  if (highestPower) {
    recordTimelineEvents.push({
      label: "Puissance max",
      date: highestPower.dateLocal,
      value: `${highestPower.maxPower || highestPower.normalizedPower} W`,
      note: highestPower.name,
      tone: "purple",
    });
  }
  if (highestHeartRate) {
    recordTimelineEvents.push({
      label: "Pic cardio",
      date: highestHeartRate.dateLocal,
      value: `${highestHeartRate.maxHr} bpm`,
      note: highestHeartRate.name,
      tone: "pink",
    });
  }

  const sleepDebtHours = toFixedNumber(
    recentSleep.reduce((total, night) => {
      const sleepNeedHours = Number(night.sleepNeedActualMinutes || 0) / 60;
      return total + Math.max(0, sleepNeedHours - Number(night.durationHours || 0));
    }, 0)
  );

  const weeklyVolume = [...weeklyMap.values()]
    .sort((left, right) => left.weekKey.localeCompare(right.weekKey))
    .slice(-10)
    .map((week) => ({
      weekKey: week.weekKey,
      distanceKm: toFixedNumber(week.distanceKm),
      durationHours: toFixedNumber(week.durationHours),
      elevationM: Math.round(week.elevationM),
      calories: Math.round(week.calories),
      trainingLoad: Math.round(week.trainingLoad),
      activityCount: week.activityCount,
    }));

  const breakdown = [...breakdownMap.values()]
    .sort((left, right) => right.distanceKm - left.distanceKm)
    .map((item) => ({
      ...item,
      distanceKm: toFixedNumber(item.distanceKm),
      durationHours: toFixedNumber(item.durationHours),
      elevationM: Math.round(item.elevationM),
      trainingLoad: Math.round(item.trainingLoad),
      averageDistanceKm: toFixedNumber(item.distanceKm / Math.max(item.count, 1)),
    }));

  const dailyByDate = new Map(fullDailyEntries.map((entry) => [entry.date, entry]));
  const sleepByDate = new Map(sleep.map((entry) => [entry.date, entry]));
  const dailyTimeline = buildDateRange(latestActivityDate, 14).map((date) => {
    const day = dailyByDate.get(date) || {};
    const daySleep = sleepByDate.get(date) || {};
    const training = trainingByDate.get(date) || {};
    return {
      date,
      steps: day.steps || 0,
      sleepHours: day.sleepHours || daySleep.durationHours || 0,
      sleepScore: daySleep.score ?? null,
      overnightHrv: daySleep.overnightHrv ?? null,
      stress: day.stress || 0,
      activeCalories: day.activeCalories || 0,
      wakeBodyBattery: day.wakeBodyBattery ?? null,
      bodyBatteryHighest: day.bodyBatteryHighest ?? null,
      bodyBatteryLowest: day.bodyBatteryLowest ?? null,
      restingHeartRate: day.restingHeartRate || 0,
      intensityMinutes: (day.moderateMinutes || 0) + (day.vigorousMinutes || 0),
      distanceKm: toFixedNumber(training.distanceKm || 0),
      durationHours: toFixedNumber(training.durationHours || 0),
      trainingLoad: Math.round(training.trainingLoad || 0),
      activityCount: training.activityCount || 0,
      calories: Math.round(training.calories || 0),
      elevationM: Math.round(training.elevationM || 0),
    };
  });

  const topLocations = [...locationMap.values()]
    .sort((left, right) => right.count - left.count || right.distanceKm - left.distanceKm)
    .slice(0, 6)
    .map((location) => ({
      ...location,
      distanceKm: toFixedNumber(location.distanceKm),
      durationHours: toFixedNumber(location.durationHours),
    }));

  const recentOutdoor = outdoorActivities.slice(0, 10);
  const geoCoordinates = recentOutdoor.flatMap((activity) =>
    [
      [activity.startLatitude, activity.startLongitude],
      [activity.endLatitude, activity.endLongitude],
    ].filter(([latitude, longitude]) => latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined)
  );
  const bounds = geoCoordinates.length
    ? {
        minLat: Math.min.apply(null, geoCoordinates.map(([latitude]) => latitude)),
        maxLat: Math.max.apply(null, geoCoordinates.map(([latitude]) => latitude)),
        minLon: Math.min.apply(null, geoCoordinates.map(([_latitude, longitude]) => longitude)),
        maxLon: Math.max.apply(null, geoCoordinates.map(([_latitude, longitude]) => longitude)),
      }
    : null;

  return {
    generatedAt: new Date().toISOString(),
    source: {
      latestActivityExport: exportsData.latestActivityExport,
      latestActivityDetailExport: exportsData.latestActivityDetailExport,
      latestDailyExport: exportsData.latestDailyExport,
      latestSleepExport: exportsData.latestSleepExport,
      latestActivityDate,
      activityCount: activities.length,
      detailedActivityCount: activities.filter((activity) => activity.splitCount || activity.maxSpeedKmh || activity.averageCadence).length,
      outdoorCount: outdoorActivities.length,
      indoorCount: indoorActivities.length,
      dailyCount: fullDailyEntries.length,
      sleepCount: sleep.length,
    },
    overview: {
      totalActivities: activities.length,
      totalRunningActivities: runningActivities.length,
      totalRideActivities: rideActivities.length,
      totalDistanceKm: toFixedNumber(sum(activities, (activity) => activity.distanceKm)),
      totalDurationHours: toFixedNumber(sum(activities, (activity) => activity.durationHours)),
      totalElevationM: Math.round(sum(activities, (activity) => activity.elevationM)),
      totalCalories: Math.round(sum(activities, (activity) => activity.calories)),
      totalTrainingLoad: Math.round(sum(activities, (activity) => activity.trainingLoad)),
      outdoorShare: activities.length ? Math.round((outdoorActivities.length / activities.length) * 100) : 0,
    },
    recent7: summarizeActivityWindow(recent7Activities),
    recent28: summarizeActivityWindow(recent28Activities),
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
      highestTrainingLoad: highestTrainingLoad ? { value: highestTrainingLoad.trainingLoad, date: highestTrainingLoad.dateLocal, name: highestTrainingLoad.name, type: highestTrainingLoad.typeKey } : null,
      highestSpeed: highestSpeed ? { value: highestSpeed.maxSpeedKmh, date: highestSpeed.dateLocal, name: highestSpeed.name, type: highestSpeed.typeKey } : null,
      highestHeartRate: highestHeartRate ? { value: highestHeartRate.maxHr, date: highestHeartRate.dateLocal, name: highestHeartRate.name, type: highestHeartRate.typeKey } : null,
      highestPower: highestPower ? { value: highestPower.maxPower || highestPower.normalizedPower, date: highestPower.dateLocal, name: highestPower.name, type: highestPower.typeKey } : null,
      lowestStamina: lowestStamina ? { value: lowestStamina.minAvailableStamina, date: lowestStamina.dateLocal, name: lowestStamina.name, type: lowestStamina.typeKey } : null,
    },
    recovery: {
      restingHeartRateAvg: Math.round(average(recentDaily, (entry) => entry.restingHeartRate)),
      wakeBodyBatteryAvg: Math.round(average(recentDaily.filter((entry) => entry.wakeBodyBattery != null), (entry) => entry.wakeBodyBattery)),
      sleepHoursAvg: toFixedNumber(average(recentDaily, (entry) => entry.sleepHours)),
      stepsAvg: Math.round(average(recentDaily, (entry) => entry.steps)),
      stressAvg: Math.round(average(recentDaily, (entry) => entry.stress)),
      activeCaloriesAvg: Math.round(average(recentDaily, (entry) => entry.activeCalories)),
      intensityMinutesAvg: Math.round(average(recentDaily, (entry) => entry.moderateMinutes + entry.vigorousMinutes)),
      bodyBatteryPeakAvg: Math.round(average(recentDaily.filter((entry) => entry.bodyBatteryHighest != null), (entry) => entry.bodyBatteryHighest)),
      bodyBatteryLowAvg: Math.round(average(recentDaily.filter((entry) => entry.bodyBatteryLowest != null), (entry) => entry.bodyBatteryLowest)),
      respirationAvg: Math.round(average(recentDaily.filter((entry) => entry.avgWakingRespiration != null), (entry) => entry.avgWakingRespiration)),
    },
    sleep: {
      scoreAvg: Math.round(average(recentSleep.filter((entry) => entry.score != null), (entry) => entry.score)),
      durationAvg: toFixedNumber(average(recentSleep, (entry) => entry.durationHours)),
      hrvAvg: Math.round(average(recentSleep.filter((entry) => entry.overnightHrv != null), (entry) => entry.overnightHrv)),
      stressAvg: Math.round(average(recentSleep, (entry) => entry.avgSleepStress)),
      sleepNeedAvgMinutes: Math.round(average(recentSleep.filter((entry) => entry.sleepNeedActualMinutes != null), (entry) => entry.sleepNeedActualMinutes)),
      recentNights: recentSleep,
    },
    patterns: {
      weekday: [...weekdayMap.values()].map((item) => ({ ...item, distanceKm: toFixedNumber(item.distanceKm), durationHours: toFixedNumber(item.durationHours), trainingLoad: Math.round(item.trainingLoad) })),
      dayPart: dayPartLabels.map((item) => {
        const part = dayPartMap.get(item.key);
        return { ...part, distanceKm: toFixedNumber(part.distanceKm), trainingLoad: Math.round(part.trainingLoad) };
      }),
      indoorOutdoor: {
        indoorCount: indoorActivities.length,
        outdoorCount: outdoorActivities.length,
        indoorDistanceKm: toFixedNumber(sum(indoorActivities, (activity) => activity.distanceKm)),
        outdoorDistanceKm: toFixedNumber(sum(outdoorActivities, (activity) => activity.distanceKm)),
      },
    },
    geography: {
      bounds,
      topLocations,
      mapPoints: recentOutdoor.map((activity) => ({
        activityId: activity.activityId,
        name: activity.name,
        typeKey: activity.typeKey,
        dateLocal: activity.dateLocal,
        locationName: activity.locationName || null,
        distanceKm: activity.distanceKm,
        durationMin: activity.durationMin,
        elevationM: activity.elevationM,
        startLatitude: activity.startLatitude,
        startLongitude: activity.startLongitude,
        endLatitude: activity.endLatitude ?? activity.startLatitude,
        endLongitude: activity.endLongitude ?? activity.startLongitude,
      })),
    },
    breakdown,
    weeklyVolume,
    dailyHistory: recentDaily,
    dailyTimeline,
    analytics: {
      loadRatio7to28:
        recent28Activities.length && recent28Activities.reduce((sumValue, activity) => sumValue + (activity.trainingLoad || 0), 0)
          ? toFixedNumber(
              (summarizeActivityWindow(recent7Activities).trainingLoad || 0) /
                Math.max((summarizeActivityWindow(recent28Activities).trainingLoad || 0) / 4, 1),
              2
            )
          : null,
      sleepDebtHours,
      cardioZones,
      powerZones,
      activityFrequencyByHour: activityFrequencyByHour.map((bucket) => ({
        ...bucket,
        trainingLoad: Math.round(bucket.trainingLoad),
        distanceKm: toFixedNumber(bucket.distanceKm),
      })),
      recordTimeline: recordTimelineEvents
        .filter((event) => event.date)
        .sort((left, right) => String(left.date).localeCompare(String(right.date))),
    },
    recentActivities: activities.slice(0, 8),
  };
};

module.exports = {
  buildSummary,
};
