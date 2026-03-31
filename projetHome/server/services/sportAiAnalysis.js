const fs = require("node:fs");
const path = require("node:path");

const getExportsDir = (config) => path.join(path.resolve(config.rootDir, ".."), "garmin crawler", "exports");

const parseJsonFile = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return null;
  }
};

const readLatestSportAiAnalysis = (config) => {
  const exportsDir = getExportsDir(config);
  if (!fs.existsSync(exportsDir)) {
    return {
      analysis: null,
      cacheKey: "no-exports",
    };
  }

  const directories = fs
    .readdirSync(exportsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();

  for (const exportName of directories) {
    const exportDir = path.join(exportsDir, exportName);
    const jsonPath = path.join(exportDir, "ollama-analysis.json");
    const textPath = path.join(exportDir, "ollama-analysis.txt");

    if (fs.existsSync(jsonPath)) {
      const stats = fs.statSync(jsonPath);
      const payload = parseJsonFile(jsonPath);
      if (payload && typeof payload.analysisText === "string" && payload.analysisText.trim()) {
        return {
          cacheKey: `${exportName}:json:${stats.mtimeMs}`,
          analysis: {
            exportName,
            generatedAt: payload.generatedAt || stats.mtime.toISOString(),
            model: payload.model || null,
            baseUrl: payload.baseUrl || null,
            analysisText: String(payload.analysisText).trim(),
            coachSignals: payload.coachSignals || null,
          },
        };
      }
    }

    if (fs.existsSync(textPath)) {
      const stats = fs.statSync(textPath);
      const analysisText = fs.readFileSync(textPath, "utf8").trim();
      if (analysisText) {
        return {
          cacheKey: `${exportName}:txt:${stats.mtimeMs}`,
          analysis: {
            exportName,
            generatedAt: stats.mtime.toISOString(),
            model: null,
            baseUrl: null,
            analysisText,
            coachSignals: null,
          },
        };
      }
    }
  }

  return {
    analysis: null,
    cacheKey: "no-analysis",
  };
};

module.exports = {
  readLatestSportAiAnalysis,
};
