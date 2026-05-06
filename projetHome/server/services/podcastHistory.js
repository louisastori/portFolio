const fs = require("node:fs/promises");
const path = require("node:path");

const MAX_PODCAST_HISTORY = 12;
const MAX_SECONDS = 24 * 60 * 60;

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value || 0)));

const trimString = (value, maxLength) => String(value || "").trim().slice(0, maxLength);

const sanitizePodcastHistoryItem = (item) => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const id = trimString(item.id, 400);
  const audioUrl = trimString(item.audioUrl, 1600);
  const title = trimString(item.title, 180);
  if (!id || !audioUrl || !title) {
    return null;
  }

  return {
    id,
    title,
    audioUrl,
    link: trimString(item.link, 1600),
    feedTitle: trimString(item.feedTitle, 120),
    category: trimString(item.category, 80),
    publishedAt: trimString(item.publishedAt, 80),
    position: clamp(item.position, 0, MAX_SECONDS),
    durationSeconds: clamp(item.durationSeconds, 0, MAX_SECONDS),
    updatedAt: trimString(item.updatedAt || new Date().toISOString(), 80),
  };
};

const sanitizePodcastHistory = (memory) => {
  const history = Array.isArray(memory && memory.history)
    ? memory.history.map(sanitizePodcastHistoryItem).filter(Boolean).slice(0, MAX_PODCAST_HISTORY)
    : [];
  const currentId = trimString((memory && memory.currentId) || (history[0] && history[0].id) || "", 400);

  return {
    currentId,
    history,
    updatedAt: new Date().toISOString(),
  };
};

const getHistoryPath = (config) => path.join(config.dataDir, "podcast-history.json");

const readPodcastHistory = async (config) => {
  try {
    const raw = await fs.readFile(getHistoryPath(config), "utf8");
    return sanitizePodcastHistory(JSON.parse(raw));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return sanitizePodcastHistory(null);
    }
    throw error;
  }
};

const writePodcastHistory = async (config, memory) => {
  const sanitized = sanitizePodcastHistory(memory);
  await fs.mkdir(config.dataDir, { recursive: true });
  await fs.writeFile(getHistoryPath(config), `${JSON.stringify(sanitized, null, 2)}\n`, "utf8");
  return sanitized;
};

const clearPodcastHistory = async (config) => writePodcastHistory(config, null);

module.exports = {
  clearPodcastHistory,
  readPodcastHistory,
  sanitizePodcastHistory,
  writePodcastHistory,
};
