import { FoodPrediction } from '../types';

// Very small heuristic placeholder to keep inference on-device without network.
// Replace this with a real TFLite / CoreML / NNAPI model when you are ready.
const FALLBACK_LABELS = ['pomme', 'banane', 'poulet', 'riz', 'pates', 'yaourt', 'fromage', 'pain'];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const guessFromFilename = (uri: string): string | null => {
  const lower = uri.toLowerCase();
  const match = FALLBACK_LABELS.find((label) => lower.includes(label));
  return match ?? null;
};

export async function classifyFood(imageUri: string): Promise<FoodPrediction[]> {
  await delay(400); // mimic on-device inference latency

  const guessedLabel = guessFromFilename(imageUri) ?? FALLBACK_LABELS[Math.floor(Math.random() * FALLBACK_LABELS.length)];

  return [
    {
      label: guessedLabel,
      confidence: 0.64,
      alternatives: FALLBACK_LABELS.filter((l) => l !== guessedLabel).slice(0, 3),
    },
  ];
}
