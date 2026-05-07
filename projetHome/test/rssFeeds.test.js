const assert = require("node:assert/strict");
const test = require("node:test");

const { RSS_GROUPS, getRssDigest } = require("../server/services/rssFeeds");

const makeRss = (feedKey, count) => `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${feedKey}</title>
    ${Array.from({ length: count }, (_, index) => {
      const day = String((index % 28) + 1).padStart(2, "0");
      return `
        <item>
          <guid>${feedKey}-${index}</guid>
          <title>${feedKey} episode ${index}</title>
          <link>https://example.test/${feedKey}/${index}</link>
          <pubDate>Mon, ${day} Apr 2026 10:00:00 GMT</pubDate>
          <description><![CDATA[Episode ${index} description with <strong>html</strong>.]]></description>
          <enclosure url="https://cdn.example.test/${feedKey}/${index}.mp3" type="audio/mpeg" />
          <itunes:duration>00:20:${String(index % 60).padStart(2, "0")}</itunes:duration>
        </item>
      `;
    }).join("")}
  </channel>
</rss>`;

test("getRssDigest respects per-feed and global item limits", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => ({
    ok: true,
    status: 200,
    statusText: "OK",
    text: async () => makeRss(new URL(url).hostname.replace(/\W+/g, "-"), 50),
  });

  const digest = await getRssDigest(
    {
      rss: {
        timeoutMs: 1000,
        cacheTtlMs: 0,
        perFeedLimit: 40,
        maxItems: 500,
      },
    },
    "podcasts",
    { forceLive: true }
  );

  assert.equal(digest.items.length, 500);
  assert.equal(digest.limits.perFeed, 40);
  assert.equal(digest.limits.maxItems, 500);
  assert.equal(digest.feeds.length, RSS_GROUPS.podcasts.feeds.length);
  assert.ok(digest.feeds.every((feed) => feed.ok));
  assert.ok(digest.feeds.every((feed) => feed.itemCount <= 40));
  assert.ok(digest.items.every((item) => item.audioUrl.endsWith(".mp3")));
});

test("getRssDigest falls back to stale cache when live feeds are unavailable", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => ({
    ok: true,
    status: 200,
    statusText: "OK",
    text: async () => makeRss(new URL(url).hostname.replace(/\W+/g, "-"), 2),
  });

  const config = {
    rss: {
      timeoutMs: 1000,
      cacheTtlMs: 60_000,
      perFeedLimit: 2,
      maxItems: 20,
    },
  };

  const fresh = await getRssDigest(config, "podcasts", { forceLive: true });
  assert.ok(fresh.items.length > 0);

  global.fetch = async () => {
    throw new Error("network down");
  };

  const stale = await getRssDigest(config, "podcasts", { forceLive: true });
  assert.equal(stale.stale, true);
  assert.equal(stale.items.length, fresh.items.length);
  assert.match(stale.staleReason, /cache precedent/);
});
