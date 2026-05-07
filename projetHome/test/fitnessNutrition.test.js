const assert = require("node:assert/strict");
const test = require("node:test");

const { fetchFitnessSnapshot } = require("../server/services/fitness");
const { fetchNutritionSnapshot } = require("../server/services/nutrition");

test("fetchFitnessSnapshot maps Strava and Garmin overview data into dashboard KPIs", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => {
    const requestUrl = new URL(url);
    assert.equal(requestUrl.searchParams.get("limit"), "8");
    assert.equal(requestUrl.searchParams.get("source"), "live");

    return {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          generatedAt: "2026-05-06T10:00:00.000Z",
          strava: {
            profile: { firstname: "Louis", lastname: "Test", city: "Bordeaux", country: "FR" },
            stats: {
              recent_ride_totals: { distance: 12345, moving_time: 7200 },
              ytd_ride_totals: { elevation_gain: 4567, count: 12 },
            },
            activities: [
              {
                id: 1,
                name: "Ride",
                sport_type: "Ride",
                start_date: "2026-05-05T08:00:00.000Z",
                distance: 10000,
                moving_time: 3600,
                total_elevation_gain: 200,
              },
            ],
          },
          garmin: {
            activities: [
              {
                activityId: 2,
                activityName: "Run",
                activityType: { typeKey: "running" },
                startTimeGMT: "2026-05-06T08:00:00.000Z",
                distance: 5000,
                duration: 1800,
                elevationGain: 40,
              },
            ],
          },
        }),
    };
  };

  const snapshot = await fetchFitnessSnapshot(
    { fitness: { baseUrl: "https://fitness.example.test", token: "", limit: 8 } },
    { forceLive: true }
  );

  assert.equal(snapshot.athleteName, "Louis Test");
  assert.equal(snapshot.kpis[0].value, 12.3);
  assert.equal(snapshot.kpis[1].value, 2);
  assert.deepEqual(
    snapshot.activities.map((activity) => activity.source),
    ["garmin", "strava"]
  );
});

test("fetchNutritionSnapshot maps Supabase meals into daily and weekly totals", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  global.fetch = async (url, init) => {
    const requestUrl = new URL(url);
    assert.equal(requestUrl.pathname, "/rest/v1/meals");
    assert.equal(init.headers.apikey, "anon");

    return {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          { id: "1", name: "Pasta", grams: 250.4, calories: 600.2, capturedAt: now.toISOString() },
          { id: "2", name: "Soup", grams: 300, calories: 200, capturedAt: yesterday.toISOString() },
        ]),
    };
  };

  const snapshot = await fetchNutritionSnapshot({
    nutrition: {
      supabaseUrl: "https://db.example.test",
      supabaseAnonKey: "anon",
      table: "meals",
      limit: 20,
    },
  });

  assert.equal(snapshot.totalToday, 600);
  assert.equal(snapshot.totalWeek, 800);
  assert.equal(snapshot.averageMeal, 400);
  assert.equal(snapshot.entries.length, 2);
});
