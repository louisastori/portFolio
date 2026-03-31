const { fetchJson } = require("../http");

const toNumber = (value, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

const metersToKm = (meters) => Math.round((meters / 1000) * 10) / 10;
const secondsToHours = (seconds) => Math.round((seconds / 3600) * 10) / 10;
const secondsToMinutes = (seconds) => Math.round(seconds / 60);

const mapKpis = (overview) => {
  const stats = overview.strava && overview.strava.stats;

  return [
    {
      label: "Distance 4 semaines",
      value: metersToKm(toNumber(stats && stats.recent_ride_totals && stats.recent_ride_totals.distance)),
      unit: "km",
    },
    {
      label: "Temps roulant 4 semaines",
      value: secondsToHours(toNumber(stats && stats.recent_ride_totals && stats.recent_ride_totals.moving_time)),
      unit: "h",
    },
    {
      label: "D+ annee",
      value: Math.round(toNumber(stats && stats.ytd_ride_totals && stats.ytd_ride_totals.elevation_gain)),
      unit: "m",
    },
    {
      label: "Sorties annee",
      value: Math.round(toNumber(stats && stats.ytd_ride_totals && stats.ytd_ride_totals.count)),
      unit: "rides",
    },
  ];
};

const mapActivities = (overview) => {
  const stravaActivities = ((overview.strava && overview.strava.activities) || []).map((activity, index) => ({
    id: `strava-${activity.id ?? index}`,
    source: "strava",
    name: activity.name || "Strava activity",
    type: activity.sport_type || activity.type || "Ride",
    date: activity.start_date_local || activity.start_date || new Date().toISOString(),
    distanceKm: metersToKm(toNumber(activity.distance)),
    durationMin: secondsToMinutes(toNumber(activity.moving_time)),
    elevationM: Math.round(toNumber(activity.total_elevation_gain)),
  }));

  const garminActivities = ((overview.garmin && overview.garmin.activities) || []).map((activity, index) => {
    const rawDuration = toNumber(activity.duration);
    const durationSeconds = rawDuration > 1_000_000 ? rawDuration / 1000 : rawDuration;

    return {
      id: `garmin-${activity.activityId ?? index}`,
      source: "garmin",
      name: activity.activityName || "Garmin activity",
      type: (activity.activityType && activity.activityType.typeKey) || "Ride",
      date: activity.startTimeLocal || activity.startTimeGMT || new Date().toISOString(),
      distanceKm: metersToKm(toNumber(activity.distance)),
      durationMin: secondsToMinutes(durationSeconds),
      elevationM: Math.round(toNumber(activity.elevationGain)),
    };
  });

  return [...stravaActivities, ...garminActivities]
    .sort((left, right) => Number(new Date(right.date)) - Number(new Date(left.date)))
    .slice(0, 12);
};

const fetchFitnessSnapshot = async (config, { forceLive = false } = {}) => {
  if (!config.fitness.baseUrl) {
    throw new Error("FITNESS_API_BASE_URL is missing.");
  }

  const headers = {};
  if (config.fitness.token) {
    headers.Authorization = `Bearer ${config.fitness.token}`;
  }

  const url = new URL("/api/overview", config.fitness.baseUrl);
  url.searchParams.set("limit", String(config.fitness.limit));
  url.searchParams.set("source", forceLive ? "live" : "cache");

  const overview = await fetchJson(url.toString(), { headers });
  const profile = overview.strava && overview.strava.profile;
  const athleteName =
    [profile && profile.firstname, profile && profile.lastname].filter(Boolean).join(" ") ||
    (profile && profile.username) ||
    "Athlete";

  return {
    athleteName,
    city: profile && profile.city,
    country: profile && profile.country,
    generatedAt: overview.generatedAt,
    kpis: mapKpis(overview),
    activities: mapActivities(overview),
  };
};

module.exports = {
  fetchFitnessSnapshot,
};
