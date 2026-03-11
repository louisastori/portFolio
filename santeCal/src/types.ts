export type FoodPrediction = {
  label: string;
  confidence: number;
  alternatives?: string[];
};

export type MealEntry = {
  id?: string;
  name: string;
  grams: number;
  calories: number;
  capturedAt: string; // ISO string
  imageUri?: string | null;
};
