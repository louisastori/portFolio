const podcastItems = [
  {
    id: "history-france",
    feedTitle: "Le Cours de l'histoire",
    category: "Histoire",
    title: "Napoleon et la France imperiale",
    link: "https://example.test/history-france",
    publishedAt: "2026-05-06T08:00:00.000Z",
    summary: "Un episode sur la France, Napoleon et l'Empire.",
    audioUrl: "https://cdn.example.test/history-france.mp3",
    duration: "01:05:00",
  },
  {
    id: "travel-japan",
    feedTitle: "Les Baladeurs",
    category: "Voyage",
    title: "Traverser le Japon en train",
    link: "https://example.test/travel-japan",
    publishedAt: "2026-05-05T08:00:00.000Z",
    summary: "Recit de voyage au Japon entre Tokyo et Kyoto.",
    audioUrl: "https://cdn.example.test/travel-japan.mp3",
    duration: "00:22:00",
  },
  {
    id: "middle-age",
    feedTitle: "Passion Medievistes",
    category: "Histoire",
    title: "Chevaliers et Moyen Age",
    link: "https://example.test/middle-age",
    publishedAt: "2026-05-04T08:00:00.000Z",
    summary: "Une discussion medievale sur les chevaliers.",
    audioUrl: "https://cdn.example.test/middle-age.mp3",
    duration: "00:12:00",
  },
];

const podcastDigest = {
  group: "podcasts",
  title: "Podcasts histoire et voyage",
  description: "Episodes de test",
  generatedAt: "2026-05-06T10:00:00.000Z",
  cacheTtlMs: 1200000,
  limits: { perFeed: 40, maxItems: 500 },
  feeds: [
    {
      id: "history",
      title: "Le Cours de l'histoire",
      category: "Histoire",
      homepage: "https://example.test/history",
      url: "https://example.test/history.xml",
      ok: true,
      itemCount: 2,
    },
    {
      id: "travel",
      title: "Les Baladeurs",
      category: "Voyage",
      homepage: "https://example.test/travel",
      url: "https://example.test/travel.xml",
      ok: true,
      itemCount: 1,
    },
  ],
  items: podcastItems,
};

module.exports = {
  podcastDigest,
};
