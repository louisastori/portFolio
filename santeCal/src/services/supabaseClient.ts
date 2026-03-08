import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import { MealEntry } from '../types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
    },
  });
}

export const isSupabaseReady = Boolean(supabase);

type SaveResult =
  | { success: true; id: string }
  | { success: false; error: string; skipped?: boolean };

export const saveMealEntry = async (entry: MealEntry): Promise<SaveResult> => {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured', skipped: true };
  }

  const { data, error } = await supabase.from('meals').insert(entry).select('id').single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
};

export const fetchMealsForDate = async (isoDate: string): Promise<{ data: MealEntry[]; error?: string }> => {
  if (!supabase) {
    return { data: [], error: 'Supabase not configured' };
  }

  const start = dayjs(isoDate).startOf('day').toISOString();
  const end = dayjs(isoDate).endOf('day').toISOString();

  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .gte('capturedAt', start)
    .lte('capturedAt', end)
    .order('capturedAt', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data };
};
