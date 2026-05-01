const { XMLParser } = require("fast-xml-parser");

const RSS_GROUPS = {
  podcasts: {
    title: "Podcasts histoire et voyage",
    description: "Episodes recents autour de l'histoire, du voyage et des recits d'ailleurs.",
    feeds: [
      {
        id: "cours-histoire",
        title: "Le Cours de l'histoire",
        category: "Histoire",
        homepage: "https://www.radiofrance.fr/emissions/le-cours-de-lhistoire",
        url: "https://radiofrance-podcast.net/podcast09/35099478-7c72-4f9e-a6de-1b928400e9e5/podcast_c951e8a9-6121-4400-a3ef-5f9c958d36c3.xml",
      },
      {
        id: "passion-medievistes",
        title: "Passion Medievistes",
        category: "Histoire",
        homepage: "https://passionmedievistes.fr/",
        url: "https://feeds.soundcloud.com/users/soundcloud:users:147058082/sounds.rss",
      },
      {
        id: "les-baladeurs",
        title: "Les Baladeurs",
        category: "Voyage",
        homepage: "https://shows.acast.com/les-baladeurs-1/about",
        url: "https://feeds.acast.com/public/shows/les-baladeurs-1",
      },
      {
        id: "french-expat",
        title: "French Expat",
        category: "Recits de voyage",
        homepage: "https://shows.acast.com/french-expat-le-podcast",
        url: "https://feeds.acast.com/public/shows/french-expat-le-podcast",
      },
    ],
  },
  dev: {
    title: "Lecture dev et IA",
    description: "Articles recents sur le developpement, la documentation web et les nouvelles IA.",
    feeds: [
      {
        id: "mdn-blog",
        title: "MDN Blog",
        category: "Documentation web",
        homepage: "https://developer.mozilla.org/en-US/blog/",
        url: "https://developer.mozilla.org/en-US/blog/rss.xml",
      },
      {
        id: "github-blog",
        title: "GitHub Blog",
        category: "Developpement",
        homepage: "https://github.blog/",
        url: "https://github.blog/feed/",
      },
      {
        id: "openai-news",
        title: "OpenAI News",
        category: "IA",
        homepage: "https://openai.com/news/",
        url: "https://openai.com/news/rss.xml",
      },
      {
        id: "google-developers",
        title: "Google Developers Blog",
        category: "IA et dev",
        homepage: "https://developers.googleblog.com/",
        url: "https://developers.googleblog.com/feeds/posts/default",
      },
    ],
  },
};

const parser = new XMLParser({
  attributeNamePrefix: "",
  cdataPropName: "cdata",
  ignoreAttributes: false,
  parseAttributeValue: false,
  parseTagValue: false,
  removeNSPrefix: true,
  textNodeName: "text",
  trimValues: true,
});

const cache = new Map();

const asArray = (value) => {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

const firstValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return "";
};

const textFromNode = (node) => {
  if (node === undefined || node === null) {
    return "";
  }

  if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return textFromNode(node[0]);
  }

  if (typeof node === "object") {
    return textFromNode(firstValue(node.cdata, node.text, node.href, node.url));
  }

  return "";
};

const decodeEntities = (value) =>
  String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

const stripHtml = (value) =>
  decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (value, maxLength) => {
  const text = stripHtml(value);
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
};

const firstLinkHref = (linkNode) => {
  const links = asArray(linkNode);
  if (!links.length) {
    return "";
  }

  const alternate = links.find((link) => !link.rel || link.rel === "alternate") || links[0];
  return textFromNode(alternate.href || alternate.url || alternate);
};

const firstEnclosureUrl = (item) => {
  const enclosure = asArray(item.enclosure)[0] || asArray(item.content)[0];
  if (!enclosure || typeof enclosure !== "object") {
    return "";
  }
  return textFromNode(enclosure.url || enclosure.href);
};

const parseDate = (value) => {
  const raw = textFromNode(value);
  if (!raw) {
    return "";
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
};

const parseFeedItems = (xml, feed) => {
  const parsed = parser.parse(xml);
  const channel = parsed && parsed.rss ? parsed.rss.channel : null;
  const atomFeed = parsed ? parsed.feed : null;
  const rawItems = channel ? asArray(channel.item) : asArray(atomFeed && atomFeed.entry);

  return rawItems.map((item, index) => {
    const title = truncate(textFromNode(firstValue(item.title, item.name)), 140) || "Sans titre";
    const link = firstLinkHref(item.link) || textFromNode(item.guid) || feed.homepage;
    const publishedAt = parseDate(firstValue(item.pubDate, item.published, item.updated, item.date));
    const summary = truncate(textFromNode(firstValue(item.description, item.summary, item.subtitle, item.encoded)), 260);

    return {
      id: `${feed.id}-${textFromNode(item.guid) || link || index}`,
      groupId: feed.groupId,
      feedId: feed.id,
      feedTitle: feed.title,
      category: feed.category,
      title,
      link,
      publishedAt,
      summary,
      audioUrl: firstEnclosureUrl(item),
      duration: textFromNode(item.duration),
    };
  });
};

const fetchText = async (url, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        "User-Agent": "ProjetHome RSS Reader",
      },
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${body.slice(0, 160) || response.statusText}`);
    }
    return body;
  } catch (error) {
    if (error && error.name === "AbortError") {
      throw new Error(`Timeout apres ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const getCacheKey = (groupId) => `rss:${groupId}`;

const sortItems = (items) =>
  [...items].sort((left, right) => {
    const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
    const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;
    return rightTime - leftTime;
  });

const getRssDigest = async (config, groupId, { forceLive = false } = {}) => {
  const group = RSS_GROUPS[groupId];
  if (!group) {
    const error = new Error(`Unknown RSS group: ${groupId}`);
    error.statusCode = 404;
    throw error;
  }

  const cacheKey = getCacheKey(groupId);
  const cached = cache.get(cacheKey);
  const now = Date.now();
  const ttlMs = config.rss.cacheTtlMs;
  if (!forceLive && cached && now - cached.cachedAt < ttlMs) {
    return cached.payload;
  }

  const perFeedLimit = config.rss.perFeedLimit;
  const results = await Promise.all(
    group.feeds.map(async (feed) => {
      try {
        const xml = await fetchText(feed.url, config.rss.timeoutMs);
        const items = parseFeedItems(xml, { ...feed, groupId }).slice(0, perFeedLimit);
        return {
          feed: {
            id: feed.id,
            title: feed.title,
            category: feed.category,
            homepage: feed.homepage,
            url: feed.url,
            ok: true,
            itemCount: items.length,
          },
          items,
        };
      } catch (error) {
        return {
          feed: {
            id: feed.id,
            title: feed.title,
            category: feed.category,
            homepage: feed.homepage,
            url: feed.url,
            ok: false,
            itemCount: 0,
            message: error && error.message ? error.message : "Flux indisponible.",
          },
          items: [],
        };
      }
    })
  );

  const items = sortItems(results.flatMap((result) => result.items)).slice(0, config.rss.maxItems);
  const hasFreshData = items.length > 0 || results.some((result) => result.feed.ok);

  if (!hasFreshData && cached) {
    return {
      ...cached.payload,
      stale: true,
      staleReason: "Les flux frais sont indisponibles; cache precedent conserve.",
    };
  }

  const payload = {
    group: groupId,
    title: group.title,
    description: group.description,
    generatedAt: new Date().toISOString(),
    cacheTtlMs: ttlMs,
    feeds: results.map((result) => result.feed),
    items,
  };

  if (hasFreshData) {
    cache.set(cacheKey, {
      cachedAt: now,
      payload,
    });
  }

  return payload;
};

module.exports = {
  RSS_GROUPS,
  getRssDigest,
};
