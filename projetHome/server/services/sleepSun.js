const { getSportSummary } = require("./garminSummary");

const BORDEAUX = {
  name: "Bordeaux",
  latitude: 44.8378,
  longitude: -0.5792,
};

const pad = (value) => String(value).padStart(2, "0");

const normalizeDateInput = (value) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const formatHoursMinutes = (totalMinutes) => {
  if (!Number.isFinite(totalMinutes)) {
    return "--:--";
  }

  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${pad(hours)}:${pad(minutes)}`;
};

const formatDuration = (minutes) => {
  if (!Number.isFinite(minutes)) {
    return "--";
  }

  const rounded = Math.max(0, Math.round(minutes));
  const hours = Math.floor(rounded / 60);
  const remain = rounded % 60;
  return hours ? `${hours} h ${pad(remain)}` : `${remain} min`;
};

const dayOfYear = (year, month, day) => {
  const current = Date.UTC(year, month - 1, day);
  const start = Date.UTC(year, 0, 0);
  return Math.floor((current - start) / 86400000);
};

const normalizeDegrees = (value) => {
  let degrees = value;
  while (degrees < 0) {
    degrees += 360;
  }
  while (degrees >= 360) {
    degrees -= 360;
  }
  return degrees;
};

const calculateSunriseUtcDate = (dateString, latitude, longitude) => {
  const [yearRaw, monthRaw, dayRaw] = dateString.split("-").map(Number);
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const zenith = 90.833;
  const lngHour = longitude / 15;
  const n = dayOfYear(year, month, day);
  const t = n + (6 - lngHour) / 24;
  const m = 0.9856 * t - 3.289;
  const l =
    normalizeDegrees(
      m +
        1.916 * Math.sin((m * Math.PI) / 180) +
        0.02 * Math.sin((2 * m * Math.PI) / 180) +
        282.634
    );
  let ra = (Math.atan(0.91764 * Math.tan((l * Math.PI) / 180)) * 180) / Math.PI;
  ra = normalizeDegrees(ra);

  const lQuadrant = Math.floor(l / 90) * 90;
  const raQuadrant = Math.floor(ra / 90) * 90;
  ra = (ra + (lQuadrant - raQuadrant)) / 15;

  const sinDec = 0.39782 * Math.sin((l * Math.PI) / 180);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH =
    (Math.cos((zenith * Math.PI) / 180) -
      sinDec * Math.sin((latitude * Math.PI) / 180)) /
    (cosDec * Math.cos((latitude * Math.PI) / 180));

  if (cosH > 1 || cosH < -1) {
    return null;
  }

  const h = (360 - (Math.acos(cosH) * 180) / Math.PI) / 15;
  const localMeanTime = h + ra - 0.06571 * t - 6.622;
  const utcHours = ((localMeanTime - lngHour) % 24 + 24) % 24;
  const utcMs = Date.UTC(year, month - 1, day) + Math.round(utcHours * 3600 * 1000);
  return new Date(utcMs);
};

const minutesFromDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.getHours() * 60 + date.getMinutes();
};

const averageMinutes = (values) => {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) {
    return null;
  }
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

const buildWakeNote = (deltaMinutes) => {
  if (!Number.isFinite(deltaMinutes)) {
    return "Pas assez de donnees pour comparer ton reveil au soleil.";
  }

  const absolute = Math.abs(Math.round(deltaMinutes));
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;
  const offset = hours ? `${hours} h ${pad(minutes)}` : `${minutes} min`;

  if (absolute < 10) {
    return "Tu te reveilles quasiment en meme temps que le soleil.";
  }

  return deltaMinutes > 0
    ? `Tu te reveilles environ ${offset} apres le soleil.`
    : `Tu te reveilles environ ${offset} avant le soleil.`;
};

const getSleepSunSnapshot = (config, { date } = {}) => {
  const sport = getSportSummary(config);
  const targetDate = normalizeDateInput(date);
  const sunriseDate = calculateSunriseUtcDate(targetDate, BORDEAUX.latitude, BORDEAUX.longitude);
  const recentNights = Array.isArray(sport.sleep?.recentNights) ? sport.sleep.recentNights.slice(-7) : [];
  const wakeMinutes = recentNights
    .map((night) => minutesFromDate(night.sleepEndTimestampGmt))
    .filter((value) => Number.isFinite(value));
  const latestNight = recentNights[recentNights.length - 1] || null;
  const averageWakeMinutes = averageMinutes(wakeMinutes);
  const latestWakeMinutes = latestNight ? minutesFromDate(latestNight.sleepEndTimestampGmt) : null;
  const sleepNeedMinutes = Number(sport.sleep?.sleepNeedAvgMinutes || 0) || Math.round(Number(sport.sleep?.durationAvg || 8) * 60);
  const sunriseMinutes = sunriseDate ? sunriseDate.getHours() * 60 + sunriseDate.getMinutes() : null;
  const bedtimeForSunriseMinutes =
    Number.isFinite(sunriseMinutes) && Number.isFinite(sleepNeedMinutes)
      ? sunriseMinutes - sleepNeedMinutes
      : null;
  const deltaVsSunriseMinutes =
    Number.isFinite(averageWakeMinutes) && Number.isFinite(sunriseMinutes)
      ? Math.round(averageWakeMinutes - sunriseMinutes)
      : null;

  return {
    generatedAt: new Date().toISOString(),
    date: targetDate,
    location: BORDEAUX,
    sunrise: {
      label: sunriseDate ? formatHoursMinutes(sunriseMinutes) : "--:--",
      iso: sunriseDate ? sunriseDate.toISOString() : null,
    },
    wake: {
      averageLabel: formatHoursMinutes(averageWakeMinutes),
      averageMinutes: Number.isFinite(averageWakeMinutes) ? Math.round(averageWakeMinutes) : null,
      latestLabel: formatHoursMinutes(latestWakeMinutes),
      latestMinutes: Number.isFinite(latestWakeMinutes) ? Math.round(latestWakeMinutes) : null,
      latestDate: latestNight ? latestNight.date : null,
      deltaVsSunriseMinutes,
      note: buildWakeNote(deltaVsSunriseMinutes),
    },
    sleepNeed: {
      averageMinutes: Number.isFinite(sleepNeedMinutes) ? Math.round(sleepNeedMinutes) : null,
      label: formatDuration(sleepNeedMinutes),
    },
    bedtimeForSunrise: {
      label: formatHoursMinutes(bedtimeForSunriseMinutes),
      minutes: Number.isFinite(bedtimeForSunriseMinutes)
        ? ((Math.round(bedtimeForSunriseMinutes) % 1440) + 1440) % 1440
        : null,
      note: Number.isFinite(bedtimeForSunriseMinutes)
        ? `Pour te reveiller avec le soleil si tu gardes un besoin moyen de ${formatDuration(sleepNeedMinutes)}.`
        : "Impossible de calculer une heure de coucher cible pour le moment.",
    },
    sleep: {
      scoreAvg: sport.sleep?.scoreAvg ?? null,
      durationAvgHours: sport.sleep?.durationAvg ?? null,
      sleepDebtHours: sport.analytics?.sleepDebtHours ?? null,
      recentNightCount: recentNights.length,
    },
    automation: {
      shutters: {
        available: false,
        targetSunriseLabel: sunriseDate ? formatHoursMinutes(sunriseMinutes) : "--:--",
        message: "A venir: ouverture automatique du volet au lever du soleil.",
      },
    },
    environment: {
      temperature: {
        available: false,
        message: "A venir: rendu de la temperature de la chambre pour suivre l impact sur le sommeil.",
      },
    },
  };
};

module.exports = {
  getSleepSunSnapshot,
};
