import dayjs from 'dayjs';
import { env } from '../config/env';
import { fetchJson } from './http';
import { NutritionEntry, NutritionSnapshot } from '../types';

type RawMeal = {
  id?: string;
  name?: string;
  grams?: number;
  calories?: number;
  capturedAt?: string;
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

const mapMeals = (items: RawMeal[]): NutritionEntry[] =>
  items
    .map((item, index) => ({
      id: item.id ?? `meal-${index}`,
      name: item.name ?? 'Unknown',
      grams: Math.round(toNumber(item.grams)),
      calories: Math.round(toNumber(item.calories)),
      capturedAt: item.capturedAt ?? new Date().toISOString(),
    }))
    .sort((a, b) => +new Date(b.capturedAt) - +new Date(a.capturedAt));

export const fetchNutritionSnapshot = async (): Promise<NutritionSnapshot> => {
  if (!env.nutrition.supabaseUrl || !env.nutrition.supabaseAnonKey) {
    throw new Error('SUPABASE_URL or SUPABASE_ANON_KEY is missing.');
  }

  const url = new URL(`/rest/v1/${env.nutrition.table}`, env.nutrition.supabaseUrl);
  url.searchParams.set('select', 'id,name,grams,calories,capturedAt');
  url.searchParams.set('order', 'capturedAt.desc');
  url.searchParams.set('limit', String(env.nutrition.limit));

  const meals = await fetchJson<RawMeal[]>(url.toString(), {
    headers: {
      apikey: env.nutrition.supabaseAnonKey,
      Authorization: `Bearer ${env.nutrition.supabaseAnonKey}`,
    },
  });

  const entries = mapMeals(Array.isArray(meals) ? meals : []);
  const startToday = dayjs().startOf('day');
  const sevenDaysAgo = dayjs().subtract(7, 'day');

  const totalToday = entries
    .filter((entry) => dayjs(entry.capturedAt).isAfter(startToday) || dayjs(entry.capturedAt).isSame(startToday))
    .reduce((sum, entry) => sum + entry.calories, 0);

  const totalWeek = entries
    .filter((entry) => dayjs(entry.capturedAt).isAfter(sevenDaysAgo) || dayjs(entry.capturedAt).isSame(sevenDaysAgo))
    .reduce((sum, entry) => sum + entry.calories, 0);

  const count = entries.length;
  const averageMeal = count > 0 ? Math.round(totalWeek / count) : 0;

  return {
    totalToday,
    totalWeek,
    averageMeal,
    count,
    entries: entries.slice(0, 12),
  };
};
