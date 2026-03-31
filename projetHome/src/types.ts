export type FitnessKpi = {
  label: string;
  value: number;
  unit: string;
};

export type FitnessActivity = {
  id: string;
  source: 'strava' | 'garmin';
  name: string;
  type: string;
  date: string;
  distanceKm: number;
  durationMin: number;
  elevationM: number;
};

export type FitnessSnapshot = {
  athleteName: string;
  city?: string;
  country?: string;
  generatedAt?: string;
  kpis: FitnessKpi[];
  activities: FitnessActivity[];
};

export type NutritionEntry = {
  id: string;
  name: string;
  grams: number;
  calories: number;
  capturedAt: string;
};

export type NutritionSnapshot = {
  totalToday: number;
  totalWeek: number;
  averageMeal: number;
  count: number;
  entries: NutritionEntry[];
};

export type LightProvider = 'hue' | 'smartlife' | 'aramsmart';

export type LightDevice = {
  id: string;
  provider: LightProvider;
  providerLightId: string;
  name: string;
  isOn: boolean;
  brightness: number;
  supportsColor?: boolean;
  colorHex?: string | null;
};

export type AppWarning = {
  scope: 'fitness' | 'nutrition' | 'lights';
  message: string;
};
