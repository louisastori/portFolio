const CALORIES_PER_100G: Record<string, number> = {
  pomme: 52,
  banane: 89,
  poulet: 165,
  riz: 130,
  pates: 131,
  yaourt: 61,
  fromage: 360,
  pain: 265,
};

export const normalizeFoodName = (name: string) => name.trim().toLowerCase();

export const estimateCalories = (name: string, grams: number): number => {
  const normalized = normalizeFoodName(name);
  const per100 = CALORIES_PER_100G[normalized];
  if (!per100 || Number.isNaN(grams)) {
    return 0;
  }
  return Math.round((grams * per100) / 100);
};

export const getKnownFoods = () => Object.keys(CALORIES_PER_100G);
