import { env } from '../config/env';
import { fetchJson } from './http';
import { FitnessActivity, FitnessKpi, FitnessSnapshot } from '../types';

type RawOverview = {
  generatedAt?: string;
  strava?: {
    profile?: {
      firstname?: string;
      lastname?: string;
      username?: string;
      city?: string;
      country?: string;
    };
    stats?: {
      recent_ride_totals?: {
        distance?: number;
        moving_time?: number;
      };
      ytd_ride_totals?: {
        elevation_gain?: number;
        count?: number;
      };
    };
    activities?: Array<{
      id?: string | number;
      name?: string;
      sport_type?: string;
      type?: string;
      start_date_local?: string;
      start_date?: string;
      distance?: number;
      moving_time?: number;
      total_elevation_gain?: number;
    }>;
  };
  garmin?: {
    activities?: Array<{
      activityId?: string | number;
      activityName?: string;
      activityType?: {
        typeKey?: string;
      };
      startTimeLocal?: string;
      startTimeGMT?: string;
      distance?: number;
      duration?: number;
      elevationGain?: number;
    }>;
  };
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

const metersToKm = (meters: number): number => Math.round((meters / 1000) * 10) / 10;
const secondsToHours = (seconds: number): number => Math.round((seconds / 3600) * 10) / 10;
const secondsToMinutes = (seconds: number): number => Math.round(seconds / 60);

const mapKpis = (overview: RawOverview): FitnessKpi[] => {
  const stats = overview.strava?.stats;

  return [
    {
      label: 'Distance 4 semaines',
      value: metersToKm(toNumber(stats?.recent_ride_totals?.distance)),
      unit: 'km',
    },
    {
      label: 'Temps roulant 4 semaines',
      value: secondsToHours(toNumber(stats?.recent_ride_totals?.moving_time)),
      unit: 'h',
    },
    {
      label: 'D+ annee',
      value: Math.round(toNumber(stats?.ytd_ride_totals?.elevation_gain)),
      unit: 'm',
    },
    {
      label: 'Sorties annee',
      value: Math.round(toNumber(stats?.ytd_ride_totals?.count)),
      unit: 'rides',
    },
  ];
};

const mapActivities = (overview: RawOverview): FitnessActivity[] => {
  const strava = (overview.strava?.activities ?? []).map((activity, index) => ({
    id: `strava-${activity.id ?? index}`,
    source: 'strava' as const,
    name: activity.name ?? 'Strava activity',
    type: activity.sport_type ?? activity.type ?? 'Ride',
    date: activity.start_date_local ?? activity.start_date ?? new Date().toISOString(),
    distanceKm: metersToKm(toNumber(activity.distance)),
    durationMin: secondsToMinutes(toNumber(activity.moving_time)),
    elevationM: Math.round(toNumber(activity.total_elevation_gain)),
  }));

  const garmin = (overview.garmin?.activities ?? []).map((activity, index) => {
    const rawDuration = toNumber(activity.duration);
    const durationSec = rawDuration > 1_000_000 ? rawDuration / 1000 : rawDuration;

    return {
      id: `garmin-${activity.activityId ?? index}`,
      source: 'garmin' as const,
      name: activity.activityName ?? 'Garmin activity',
      type: activity.activityType?.typeKey ?? 'Ride',
      date: activity.startTimeLocal ?? activity.startTimeGMT ?? new Date().toISOString(),
      distanceKm: metersToKm(toNumber(activity.distance)),
      durationMin: secondsToMinutes(durationSec),
      elevationM: Math.round(toNumber(activity.elevationGain)),
    };
  });

  return [...strava, ...garmin]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 12);
};

export const fetchFitnessSnapshot = async (forceLive = false): Promise<FitnessSnapshot> => {
  if (!env.fitness.baseUrl) {
    throw new Error('EXPO_PUBLIC_FITNESS_API_BASE_URL is missing.');
  }

  const headers: Record<string, string> = {};
  if (env.fitness.token) {
    headers.Authorization = `Bearer ${env.fitness.token}`;
  }

  const url = new URL('/api/overview', env.fitness.baseUrl);
  url.searchParams.set('limit', String(env.fitness.limit));
  url.searchParams.set('source', forceLive ? 'live' : 'cache');

  const overview = await fetchJson<RawOverview>(url.toString(), { headers });
  const profile = overview.strava?.profile;
  const athleteName = [profile?.firstname, profile?.lastname].filter(Boolean).join(' ') || profile?.username || 'Athlete';

  return {
    athleteName,
    city: profile?.city,
    country: profile?.country,
    generatedAt: overview.generatedAt,
    kpis: mapKpis(overview),
    activities: mapActivities(overview),
  };
};
