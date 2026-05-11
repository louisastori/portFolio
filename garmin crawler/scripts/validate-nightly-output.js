const fs = require("node:fs");
const path = require("node:path");

const workspaceDir = path.resolve(__dirname, "..", "..");
const crawlerDir = path.join(workspaceDir, "garmin crawler");
const exportsDir = process.env.GARMIN_CRAWLER_EXPORTS_PATH
  ? path.resolve(process.env.GARMIN_CRAWLER_EXPORTS_PATH)
  : path.join(crawlerDir, "exports");
const portfolioSummaryPath = path.join(workspaceDir, "portfolio", "assets", "data", "garmin-summary.json");
const portfolioSummaryScriptPath = path.join(workspaceDir, "portfolio", "assets", "data", "garmin-summary.js");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const listExportDirs = () => {
  assert(fs.existsSync(exportsDir), `Exports directory not found: ${exportsDir}`);
  return fs
    .readdirSync(exportsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
};

const getPresentGarminJsonFiles = (exportDir) => {
  const expectedJsonFiles = [
    "activities.json",
    "daily-summaries.json",
    "profile.json",
    "sleep.json",
  ];

  return expectedJsonFiles.filter((fileName) =>
    fs.existsSync(path.join(exportDir, fileName))
  );
};

const validateLatestExport = () => {
  const exportNames = listExportDirs();
  assert(exportNames.length > 0, `No export directories found in ${exportsDir}`);

  const latestExportName = [...exportNames]
    .reverse()
    .find((exportName) => getPresentGarminJsonFiles(path.join(exportsDir, exportName)).length > 0);
  assert(latestExportName, `No usable Garmin export directories found in ${exportsDir}`);

  const latestExportDir = path.join(exportsDir, latestExportName);
  const presentJsonFiles = getPresentGarminJsonFiles(latestExportDir);

  for (const fileName of presentJsonFiles) {
    readJson(path.join(latestExportDir, fileName));
  }

  const activitiesPath = path.join(latestExportDir, "activities.json");
  if (fs.existsSync(activitiesPath)) {
    const activitiesPayload = readJson(activitiesPath);
    assert(
      Array.isArray(activitiesPayload.data) || Array.isArray(activitiesPayload),
      `activities.json in ${latestExportName} does not look like a Garmin activities export.`
    );
  }

  const analysisPath = path.join(latestExportDir, "ollama-analysis.json");
  if (fs.existsSync(analysisPath)) {
    const analysisPayload = readJson(analysisPath);
    assert(
      typeof analysisPayload.analysisText === "string" && analysisPayload.analysisText.trim(),
      `ollama-analysis.json in ${latestExportName} has no analysisText.`
    );
  }

  return latestExportName;
};

const validatePortfolioSummary = () => {
  if (!fs.existsSync(portfolioSummaryPath)) {
    return false;
  }

  const summary = readJson(portfolioSummaryPath);
  assert(summary && typeof summary === "object", "Portfolio Garmin summary is not a JSON object.");

  if (fs.existsSync(portfolioSummaryScriptPath)) {
    const scriptContent = fs.readFileSync(portfolioSummaryScriptPath, "utf8");
    assert(
      scriptContent.includes("garmin") || scriptContent.includes("GARMIN"),
      "Portfolio Garmin summary JS does not look like a generated Garmin data file."
    );
  }

  return true;
};

const main = () => {
  const latestExportName = validateLatestExport();
  const hasPortfolioSummary = validatePortfolioSummary();

  console.log(
    JSON.stringify(
      {
        ok: true,
        latestExportName,
        hasPortfolioSummary,
      },
      null,
      2
    )
  );
};

try {
  main();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
