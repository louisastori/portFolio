const fs = require("node:fs");
const { buildSummary } = require("./garminSummaryBuild");
const { dedupeExports, getExportsDir } = require("./garminSummaryShared");
const { readLatestSportAiAnalysis } = require("./sportAiAnalysis");

let cache = {
  key: "",
  value: null,
};

const getSportSummary = (config) => {
  const exportsDir = getExportsDir(config);
  if (!fs.existsSync(exportsDir)) {
    throw new Error("Garmin exports directory not found.");
  }

  const exportsData = dedupeExports(exportsDir);
  if (!exportsData.cacheKey) {
    throw new Error("No Garmin exports were found.");
  }

  const aiAnalysisState = readLatestSportAiAnalysis(config);
  const cacheKey = `${exportsData.cacheKey}::${aiAnalysisState.cacheKey}`;

  if (cache.value && cache.key === cacheKey) {
    return cache.value;
  }

  const summary = buildSummary(exportsData);
  summary.aiAnalysis = aiAnalysisState.analysis;
  cache = {
    key: cacheKey,
    value: summary,
  };
  return summary;
};

module.exports = {
  getSportSummary,
};
