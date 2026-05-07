const { expect, test } = require("@playwright/test");
const { podcastDigest } = require("./fixtures");

test.beforeEach(async ({ page }) => {
  let podcastMemory = { currentId: "", history: [], updatedAt: "2026-05-06T10:00:00.000Z" };

  await page.route("**/fonts.googleapis.com/**", (route) => route.abort());
  await page.route("**/fonts.gstatic.com/**", (route) => route.abort());
  await page.route("**/api/dashboard**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        generatedAt: "2026-05-06T10:00:00.000Z",
        refreshIntervalMs: 60000,
        fitness: null,
        sport: null,
        nutrition: null,
        lights: [],
        warnings: [],
      }),
    })
  );
  await page.route("**/api/rss/podcasts**", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(podcastDigest) })
  );
  await page.route("**/api/podcasts/history", async (route) => {
    if (route.request().method() === "POST") {
      podcastMemory = route.request().postDataJSON();
    }
    if (route.request().method() === "DELETE") {
      podcastMemory = { currentId: "", history: [], updatedAt: "2026-05-06T10:00:00.000Z" };
    }
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(podcastMemory),
    });
  });
});

test("home page renders navigation and stable frame", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "Podcasts" })).toBeVisible();
  await expect(page.locator("#syncStatus")).toContainText(/Hub|stable|degrade/i);
  await expect(page.locator(".nav-link")).toHaveCount(8);
});

test("podcast page filters by theme, country, era and collapses sources", async ({ page }) => {
  await page.goto("/podcasts.html", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Dernières sorties" })).toBeVisible();
  await expect(page.locator(".rss-card")).toHaveCount(3);

  await expect(page.locator(".rss-sources-panel")).not.toHaveAttribute("open", "");
  await page.locator(".rss-sources-summary").click();
  await expect(page.locator(".rss-sources-panel")).toHaveAttribute("open", "");

  await page.selectOption("#rssThemeFilter", "voyage");
  await expect(page.locator(".rss-card")).toHaveCount(1);
  await expect(page.getByText("Traverser le Japon en train")).toBeVisible();

  await page.selectOption("#rssCountryFilter", "japon");
  await expect(page.locator(".rss-card")).toHaveCount(1);

  await page.selectOption("#rssThemeFilter", "histoire");
  await page.selectOption("#rssCountryFilter", "all");
  await page.selectOption("#rssEraFilter", "moyen-age");
  await expect(page.locator(".rss-card")).toHaveCount(1);
  await expect(page.getByText("Chevaliers et Moyen Age")).toBeVisible();
});

test("podcast page resumes playback UI and filters in-progress items", async ({ page }) => {
  const memory = {
    currentId: "history-france",
    history: [
      {
        ...podcastDigest.items[0],
        position: 60,
        durationSeconds: 3600,
        updatedAt: "2026-05-06T10:00:00.000Z",
      },
    ],
    updatedAt: "2026-05-06T10:00:00.000Z",
  };

  await page.unroute("**/api/podcasts/history");
  await page.route("**/api/podcasts/history", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(memory),
    })
  );
  await page.addInitScript((value) => {
    window.localStorage.setItem("projethome:podcasts:v1", JSON.stringify(value));
  }, memory);

  await page.goto("/podcasts.html", { waitUntil: "domcontentloaded" });

  await expect(page.locator(".podcast-player")).toContainText("En lecture");
  await expect(page.locator(".podcast-dock")).toBeVisible();
  await page.selectOption("#rssPlaybackFilter", "in-progress");

  await expect(page.locator(".rss-card")).toHaveCount(1);
  await expect(page.locator(".rss-card")).toContainText("Napoleon");
});

test("settings page exposes memory clear actions", async ({ page }) => {
  await page.goto("/reglages.html", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Mémoire locale|Memoire locale/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Effacer podcasts/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Tout effacer/i })).toBeVisible();
});
