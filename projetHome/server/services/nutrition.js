const { fetchJson } = require("../http");

const toNumber = (value, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

const mapMeals = (items) =>
  items
    .map((item, index) => ({
      id: item.id || `meal-${index}`,
      name: item.name || "Unknown",
      grams: Math.round(toNumber(item.grams)),
      calories: Math.round(toNumber(item.calories)),
      capturedAt: item.capturedAt || new Date().toISOString(),
    }))
    .sort((left, right) => Number(new Date(right.capturedAt)) - Number(new Date(left.capturedAt)));

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const startOfSevenDaysWindow = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - 7);
  return date.getTime();
};

const fetchNutritionSnapshot = async (config) => {
  if (!config.nutrition.supabaseUrl || !config.nutrition.supabaseAnonKey) {
    throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is missing.");
  }

  const url = new URL(`/rest/v1/${config.nutrition.table}`, config.nutrition.supabaseUrl);
  url.searchParams.set("select", "id,name,grams,calories,capturedAt");
  url.searchParams.set("order", "capturedAt.desc");
  url.searchParams.set("limit", String(config.nutrition.limit));

  const meals = await fetchJson(url.toString(), {
    headers: {
      apikey: config.nutrition.supabaseAnonKey,
      Authorization: `Bearer ${config.nutrition.supabaseAnonKey}`,
    },
  });

  const entries = mapMeals(Array.isArray(meals) ? meals : []);
  const todayFloor = startOfToday();
  const sevenDaysFloor = startOfSevenDaysWindow();

  const totalToday = entries
    .filter((entry) => Number(new Date(entry.capturedAt)) >= todayFloor)
    .reduce((sum, entry) => sum + entry.calories, 0);

  const totalWeek = entries
    .filter((entry) => Number(new Date(entry.capturedAt)) >= sevenDaysFloor)
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

module.exports = {
  fetchNutritionSnapshot,
};
