const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  clearPodcastHistory,
  readPodcastHistory,
  sanitizePodcastHistory,
  writePodcastHistory,
} = require("../server/services/podcastHistory");

const makeItem = (index, overrides = {}) => ({
  id: `episode-${index}`,
  title: `Episode ${index}`,
  audioUrl: `https://example.test/audio-${index}.mp3`,
  link: `https://example.test/episode-${index}`,
  feedTitle: "Test feed",
  category: "Histoire",
  position: index * 10,
  durationSeconds: 3600,
  ...overrides,
});

test("sanitizePodcastHistory keeps only valid recent items and clamps playback values", () => {
  const history = Array.from({ length: 14 }, (_, index) => makeItem(index + 1));
  history.splice(3, 0, { id: "invalid-no-audio", title: "Invalid" });

  const sanitized = sanitizePodcastHistory({
    currentId: "episode-2",
    history: [
      makeItem(99, {
        position: -20,
        durationSeconds: 200000,
      }),
      ...history,
    ],
  });

  assert.equal(sanitized.currentId, "episode-2");
  assert.equal(sanitized.history.length, 12);
  assert.equal(sanitized.history[0].id, "episode-99");
  assert.equal(sanitized.history[0].position, 0);
  assert.equal(sanitized.history[0].durationSeconds, 24 * 60 * 60);
  assert.ok(sanitized.history.every((item) => item.audioUrl && item.title));
});

test("podcast history can be written, read, and cleared from runtime data", async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "projethome-podcasts-"));
  const config = { dataDir };

  const written = await writePodcastHistory(config, {
    currentId: "episode-1",
    history: [makeItem(1), makeItem(2)],
  });
  const read = await readPodcastHistory(config);

  assert.equal(written.history.length, 2);
  assert.equal(read.currentId, "episode-1");
  assert.deepEqual(
    read.history.map((item) => item.id),
    ["episode-1", "episode-2"]
  );

  const cleared = await clearPodcastHistory(config);
  assert.equal(cleared.history.length, 0);
  assert.equal((await readPodcastHistory(config)).history.length, 0);

  await fs.rm(dataDir, { recursive: true, force: true });
});
