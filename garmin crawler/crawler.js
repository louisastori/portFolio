const fs = require('node:fs/promises');
const path = require('node:path');
const puppeteer = require('puppeteer');

const GARMIN_ORIGIN = 'https://connect.garmin.com';
const GARMIN_MODERN_URL = `${GARMIN_ORIGIN}/modern/`;
const DEFAULT_BROWSER_URL = process.env.CHROME_DEBUG_URL || 'http://127.0.0.1:9222';
const DEFAULT_ACTIVITY_LIMIT = 20;
const DEFAULT_LOOKBACK_DAYS = 7;

function printHelp() {
  console.log(`
Usage:
  node crawler.js [options]

Options:
  --browser-url <url>         Chrome DevTools endpoint base URL (default: ${DEFAULT_BROWSER_URL})
  --start-date <YYYY-MM-DD>   Start date for daily exports (default: today - ${DEFAULT_LOOKBACK_DAYS} days)
  --end-date <YYYY-MM-DD>     End date for daily exports (default: today)
  --activity-limit <number>   Number of activities to fetch (default: ${DEFAULT_ACTIVITY_LIMIT})
  --skip-activity-details     Skip per-activity detail fetches
  --output-dir <path>         Output folder (default: ./exports/<timestamp>)
  --help                      Show this help

Typical flow:
  1. Run: npm run chrome:debug
  2. If Garmin is not already authenticated in the automation profile, sign in once in the opened Chrome window.
  3. Run: npm run crawl
`);
}

function parseArgs(argv) {
  const args = {
    browserUrl: DEFAULT_BROWSER_URL,
    activityLimit: DEFAULT_ACTIVITY_LIMIT,
    skipActivityDetails: false,
    outputDir: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--help') {
      args.help = true;
      continue;
    }

    if (token === '--skip-activity-details') {
      args.skipActivityDetails = true;
      continue;
    }

    const nextValue = argv[index + 1];
    if (!nextValue || nextValue.startsWith('--')) {
      throw new Error(`Missing value for ${token}`);
    }

    switch (token) {
      case '--browser-url':
        args.browserUrl = nextValue;
        index += 1;
        break;
      case '--start-date':
        args.startDate = normalizeIsoDate(nextValue, '--start-date');
        index += 1;
        break;
      case '--end-date':
        args.endDate = normalizeIsoDate(nextValue, '--end-date');
        index += 1;
        break;
      case '--activity-limit':
        args.activityLimit = normalizePositiveInt(nextValue, '--activity-limit');
        index += 1;
        break;
      case '--output-dir':
        args.outputDir = nextValue;
        index += 1;
        break;
      default:
        throw new Error(`Unknown option: ${token}`);
    }
  }

  const today = isoDateFromDate(new Date());
  args.endDate = args.endDate || today;
  args.startDate = args.startDate || shiftIsoDate(args.endDate, -DEFAULT_LOOKBACK_DAYS);

  if (args.startDate > args.endDate) {
    throw new Error(`Invalid date range: ${args.startDate} is after ${args.endDate}`);
  }

  return args;
}

function normalizeIsoDate(value, optionName) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${optionName} must use YYYY-MM-DD`);
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${optionName} is not a valid date`);
  }

  return isoDateFromDate(parsed);
}

function normalizePositiveInt(value, optionName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${optionName} must be a positive integer`);
  }

  return parsed;
}

function isoDateFromDate(date) {
  return date.toISOString().slice(0, 10);
}

function shiftIsoDate(isoDate, dayOffset) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return isoDateFromDate(date);
}

function buildDateRange(startDate, endDate) {
  const dates = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    dates.push(cursor);
    cursor = shiftIsoDate(cursor, 1);
  }

  return dates;
}

function buildOutputDir(requestedOutputDir) {
  if (requestedOutputDir) {
    return path.resolve(requestedOutputDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.resolve(process.cwd(), 'exports', timestamp);
}

function buildCandidateUrls(servicePath) {
  return [`${GARMIN_ORIGIN}${servicePath}`];
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatAttemptSummary(attempts) {
  return attempts
    .map((attempt) => {
      if (attempt.error) {
        return `${attempt.url} -> ${attempt.error}`;
      }

      return `${attempt.url} -> HTTP ${attempt.status}`;
    })
    .join(' | ');
}

async function ensureChromeDebugEndpoint(browserUrl) {
  const healthUrl = `${browserUrl.replace(/\/$/, '')}/json/version`;
  let response;

  try {
    response = await fetch(healthUrl);
  } catch (error) {
    throw new Error([
      `Chrome DevTools n'est pas joignable sur ${browserUrl}.`,
      'Lance `npm run chrome:debug` pour demarrer le profil Chrome dedie a l\'automatisation.',
      'Ensuite relance `npm run crawl`.',
      `Cause originale: ${error.message}`,
    ].join('\n'));
  }

  if (!response.ok) {
    throw new Error(`Chrome DevTools a repondu ${response.status} sur ${healthUrl}`);
  }

  return response.json();
}

async function connectToChrome(browserUrl) {
  await ensureChromeDebugEndpoint(browserUrl);

  try {
    return await puppeteer.connect({
      browserURL: browserUrl,
      defaultViewport: null,
    });
  } catch (error) {
    throw new Error([
      `Connexion a Chrome impossible via ${browserUrl}.`,
      'Verifie que Chrome a ete lance avec un port de remote debugging actif.',
      `Cause originale: ${error.message}`,
    ].join('\n'));
  }
}

async function ensureGarminPage(browser) {
  const pages = await browser.pages();
  let page = pages.find((candidate) => candidate.url().includes('connect.garmin.com'));

  if (!page) {
    page = await browser.newPage();
  }

  await page.bringToFront();
  await page.goto(GARMIN_MODERN_URL, {
    timeout: 120000,
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector('body', { timeout: 60000 });

  return page;
}

async function fetchJsonFromPage(page, candidateUrls, label) {
  const result = await page.evaluate(async ({ urls }) => {
    const attempts = [];
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          credentials: 'include',
          headers: {
            accept: 'application/json, text/plain, */*',
            'connect-csrf-token': csrfToken,
            'x-requested-with': 'XMLHttpRequest',
            nk: 'NT',
            'x-lang': navigator.language,
          },
        });
        const text = await response.text();
        let data = null;

        if (text) {
          try {
            data = JSON.parse(text);
          } catch (error) {
            attempts.push({
              url,
              status: response.status,
              error: `Invalid JSON response: ${error.message}`,
            });
            continue;
          }
        }

        if (response.ok) {
          return {
            ok: true,
            url,
            status: response.status,
            data,
          };
        }

        attempts.push({
          url,
          status: response.status,
          error: text ? text.slice(0, 300) : '',
        });
      } catch (error) {
        attempts.push({
          url,
          error: error.message,
        });
      }
    }

    return {
      ok: false,
      attempts,
    };
  }, { urls: candidateUrls });

  if (!result.ok) {
    throw new Error(`Impossible de recuperer ${label}: ${formatAttemptSummary(result.attempts)}`);
  }

  return result;
}

async function fetchJsonFromPageSoft(page, candidateUrls) {
  try {
    const result = await fetchJsonFromPage(page, candidateUrls, candidateUrls[0]);
    return {
      ok: true,
      source: result.url,
      status: result.status,
      data: result.data,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

async function fetchSocialProfile(page) {
  const result = await fetchJsonFromPage(
    page,
    buildCandidateUrls('/gc-api/userprofile-service/socialProfile'),
    'le profil Garmin'
  );

  if (!result.data || typeof result.data !== 'object') {
    throw new Error('Le profil Garmin a repondu sans JSON exploitable.');
  }

  return {
    source: result.url,
    data: result.data,
  };
}

async function waitForAuthenticatedProfile(page, timeoutMs = 300000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'Unknown Garmin authentication error';
  let hintShown = false;

  while (Date.now() < deadline) {
    try {
      return await fetchSocialProfile(page);
    } catch (error) {
      lastError = error.message;

      if (!hintShown) {
        console.log('Garmin session not ready yet. Sign in in the opened Chrome window if needed. Waiting up to 5 minutes...');
        hintShown = true;
      }

      await sleep(5000);
    }
  }

  throw new Error(`Garmin authentication was not detected within 5 minutes. Last error: ${lastError}`);
}

async function fetchActivities(page, limit) {
  const result = await fetchJsonFromPage(
    page,
    buildCandidateUrls(`/gc-api/activitylist-service/activities/search/activities?start=0&limit=${limit}`),
    'la liste des activites'
  );

  if (!Array.isArray(result.data)) {
    throw new Error('La liste des activites n\'est pas au format attendu.');
  }

  return {
    source: result.url,
    data: result.data,
  };
}

async function fetchActivityDetail(page, activityId) {
  return fetchJsonFromPageSoft(
    page,
    buildCandidateUrls(`/gc-api/activity-service/activity/${activityId}`)
  );
}

async function fetchDailySummary(page, displayName, date) {
  const usersummary = await fetchJsonFromPageSoft(
    page,
    buildCandidateUrls(`/gc-api/usersummary-service/usersummary/daily/${displayName}?calendarDate=${date}`)
  );

  const wellness = await fetchJsonFromPageSoft(
    page,
    buildCandidateUrls(`/gc-api/wellness-service/wellness/dailySummaryChart/${displayName}?date=${date}`)
  );

  return {
    date,
    usersummary,
    dailySummaryChart: wellness,
  };
}

async function fetchSleep(page, displayName, date) {
  const sleep = await fetchJsonFromPageSoft(
    page,
    buildCandidateUrls(`/gc-api/wellness-service/wellness/dailySleepData/${displayName}?date=${date}`)
  );

  return {
    date,
    ...sleep,
  };
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const outputDir = buildOutputDir(args.outputDir);
  await fs.mkdir(outputDir, { recursive: true });

  let browser;
  try {
    console.log(`Connecting to Chrome on ${args.browserUrl}...`);
    browser = await connectToChrome(args.browserUrl);

    console.log('Opening Garmin Connect...');
    const page = await ensureGarminPage(browser);

    console.log('Checking Garmin authentication...');
    const profile = await waitForAuthenticatedProfile(page);
    const displayName =
      profile.data.displayName ||
      profile.data.userName ||
      profile.data.profileId ||
      profile.data.id;

    if (!displayName) {
      throw new Error('Impossible de determiner le displayName Garmin depuis le profil.');
    }

    console.log(`Authenticated as ${displayName}.`);

    console.log(`Fetching the latest ${args.activityLimit} activities...`);
    const activities = await fetchActivities(page, args.activityLimit);

    const activityDetails = [];
    if (!args.skipActivityDetails) {
      for (const activity of activities.data) {
        const activityId = activity.activityId || activity.id;
        if (!activityId) {
          activityDetails.push({
            ok: false,
            error: 'Missing activity identifier',
            activity,
          });
          continue;
        }

        console.log(`Fetching activity detail ${activityId}...`);
        const detail = await fetchActivityDetail(page, activityId);
        activityDetails.push({
          activityId,
          ...detail,
        });
      }
    }

    const dates = buildDateRange(args.startDate, args.endDate);
    const dailySummaries = [];
    const sleep = [];

    for (const date of dates) {
      console.log(`Fetching daily data for ${date}...`);
      dailySummaries.push(await fetchDailySummary(page, displayName, date));
      sleep.push(await fetchSleep(page, displayName, date));
    }

    const metadata = {
      generatedAt: new Date().toISOString(),
      browserUrl: args.browserUrl,
      outputDir,
      displayName,
      startDate: args.startDate,
      endDate: args.endDate,
      activityLimit: args.activityLimit,
      activityCount: activities.data.length,
      activityDetailCount: activityDetails.length,
      dailyEntryCount: dailySummaries.length,
      sleepEntryCount: sleep.length,
      pageUrl: page.url(),
    };

    await Promise.all([
      writeJson(path.join(outputDir, 'metadata.json'), metadata),
      writeJson(path.join(outputDir, 'profile.json'), profile),
      writeJson(path.join(outputDir, 'activities.json'), activities),
      writeJson(path.join(outputDir, 'activity-details.json'), activityDetails),
      writeJson(path.join(outputDir, 'daily-summaries.json'), dailySummaries),
      writeJson(path.join(outputDir, 'sleep.json'), sleep),
    ]);

    console.log(`Export complete: ${outputDir}`);
  } finally {
    if (browser) {
      await browser.disconnect();
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
