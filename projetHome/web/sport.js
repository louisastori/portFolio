(function () {
  const sportTypeLabels = {
    running: "Course",
    treadmill_running: "Tapis",
    trail_running: "Trail",
    cycling: "Cyclisme",
    road_biking: "Route",
    virtual_ride: "Home trainer",
  };

  const sleepScoreLabels = {
    EXCELLENT: "Excellent",
    FAIR: "Correct",
    GOOD: "Bon",
    POOR: "Faible",
  };

  let visualId = 0;

  const esc = (value) =>
    String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const num = (value, digits = 1) => {
    if (!Number.isFinite(value)) {
      return "-";
    }

    return Number.isInteger(value)
      ? value.toLocaleString("fr-FR")
      : value.toLocaleString("fr-FR", { maximumFractionDigits: digits });
  };

  const longDate = (value) => {
    if (!value) return "--";
    const iso = value.indexOf("T") >= 0 ? value : `${value}T12:00:00`;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "--";
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(date);
  };

  const shortDay = (value) => {
    if (!value) return "--";
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return "--";
    return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "2-digit" }).format(date);
  };

  const clock = (seconds) => {
    if (seconds === null || seconds === undefined) return "--";
    const total = Math.round(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remain = total % 60;
    return hours
      ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`
      : `${minutes}:${String(remain).padStart(2, "0")}`;
  };

  const minutesLabel = (minutes) => {
    const safe = Math.round(minutes || 0);
    const hours = Math.floor(safe / 60);
    const remain = safe % 60;
    return hours ? `${hours} h ${String(remain).padStart(2, "0")}` : `${remain} min`;
  };

  const pace = (secondsPerKm) => (secondsPerKm ? `${clock(secondsPerKm)} /km` : "--");

  const effect = (value) =>
    value
      ? String(value)
          .toLowerCase()
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      : "Seance";

  const activityTypeLabel = (value) => sportTypeLabels[value] || value || "Activite";

  const activityMetric = (activity) => {
    const typeKey = String(activity.typeKey || "");
    if (typeKey.indexOf("cycl") >= 0 || typeKey.indexOf("bike") >= 0 || typeKey.indexOf("ride") >= 0) {
      return activity.averageSpeedKmh ? `${num(activity.averageSpeedKmh)} km/h` : "--";
    }
    return pace(activity.paceSecPerKm);
  };

  const emptyPanel = (message) => `<p class="sport-soft-label">${esc(message)}</p>`;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value || 0)));
  const averageOf = (items, getter) =>
    items.length ? items.reduce((total, item) => total + Number(getter(item) || 0), 0) / items.length : 0;
  const maxOf = (items, getter) =>
    Math.max.apply(
      null,
      items.map((item) => Number(getter(item) || 0)).concat([0])
    );
  const nextVisualId = (prefix) => `${prefix}-${visualId++}`;

  const metricCard = ({ label, value, note, toneClass = "" }) => `
    <article class="sport-metric-card sport-priority-card ${toneClass}">
      <p class="sport-soft-label">${esc(label)}</p>
      <span class="sport-metric-value">${esc(value)}</span>
      <p class="sport-metric-note">${esc(note)}</p>
    </article>
  `;

  const summaryBadge = ({ label, value, note, toneClass = "" }) => `
    <article class="sport-hero-badge ${toneClass}">
      <p class="sport-hero-badge-label">${esc(label)}</p>
      <p class="sport-hero-badge-value">${esc(value)}</p>
      <p class="sport-hero-badge-note">${esc(note)}</p>
    </article>
  `;

  const buildSmoothPath = (points) => {
    if (!points.length) {
      return "";
    }

    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let index = 0; index < points.length - 1; index += 1) {
      const current = points[index];
      const next = points[index + 1];
      const centerX = (current.x + next.x) / 2;
      const centerY = (current.y + next.y) / 2;
      path += ` Q ${current.x} ${current.y} ${centerX} ${centerY}`;
    }

    const last = points[points.length - 1];
    path += ` T ${last.x} ${last.y}`;
    return path;
  };

  const buildAreaPath = (points, baselineY) => {
    if (!points.length) {
      return "";
    }

    const linePath = buildSmoothPath(points);
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  };

  const buildSparklineSvg = ({ values, colorStart, colorEnd, glowColor, labels }) => {
    const series = values.map((value) => Number(value || 0));
    const width = 560;
    const height = 176;
    const padding = 18;
    const bottom = height - padding;
    const maxValue = Math.max.apply(null, series.concat([1]));
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;
    const gradientId = nextVisualId("spark-gradient");
    const points = series.map((value, index) => ({
      x: padding + (usableWidth * index) / Math.max(series.length - 1, 1),
      y: bottom - (value / maxValue) * usableHeight,
    }));
    const linePath = buildSmoothPath(points);
    const areaPath = buildAreaPath(points, bottom);
    const grid = Array.from({ length: 4 }, (_item, index) => {
      const y = padding + (usableHeight / 3) * index;
      return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" class="sport-sparkline-grid" />`;
    }).join("");
    const firstPoint = points[0] || { x: padding, y: bottom };
    const lastPoint = points[points.length - 1] || { x: width - padding, y: bottom };
    const firstLabel = labels && labels.length ? labels[0] : "";
    const lastLabel = labels && labels.length ? labels[labels.length - 1] : "";

    return `
      <svg class="sport-sparkline-svg" viewBox="0 0 ${width} ${height}" aria-hidden="true">
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${colorStart}" stop-opacity="0.96" />
            <stop offset="100%" stop-color="${colorEnd}" stop-opacity="0.42" />
          </linearGradient>
        </defs>
        ${grid}
        <path d="${areaPath}" fill="url(#${gradientId})" fill-opacity="0.18" />
        <path d="${linePath}" class="sport-sparkline-line sport-sparkline-glow" style="--spark-color:${glowColor}" />
        <path d="${linePath}" class="sport-sparkline-line" style="--spark-color:${colorStart}" />
        <circle cx="${firstPoint.x}" cy="${firstPoint.y}" r="4" class="sport-sparkline-dot start" style="--spark-color:${colorStart}" />
        <circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="5.5" class="sport-sparkline-dot end" style="--spark-color:${colorStart}" />
        ${firstLabel ? `<text x="${firstPoint.x}" y="${height - 4}" class="sport-sparkline-label">${esc(firstLabel)}</text>` : ""}
        ${lastLabel ? `<text x="${lastPoint.x}" y="${height - 4}" text-anchor="end" class="sport-sparkline-label">${esc(lastLabel)}</text>` : ""}
      </svg>
    `;
  };

  const ringGauge = ({ value, max = 100, label, note, toneClass = "" }) => {
    const safeValue = clamp(value, 0, max);
    const size = 118;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const progress = circumference - (safeValue / max) * circumference;

    return `
      <article class="sport-ring-card ${toneClass}">
        <div class="sport-ring-visual">
          <svg viewBox="0 0 ${size} ${size}" class="sport-ring-svg" aria-hidden="true">
            <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" class="sport-ring-track" />
            <circle
              cx="${size / 2}"
              cy="${size / 2}"
              r="${radius}"
              class="sport-ring-progress"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${progress}"
            />
          </svg>
          <div class="sport-ring-value">
            <strong>${esc(`${Math.round(safeValue)}`)}</strong>
            <span>/ ${esc(String(max))}</span>
          </div>
        </div>
        <p class="sport-soft-label">${esc(label)}</p>
        <p class="sport-ring-note">${esc(note)}</p>
      </article>
    `;
  };

  const buildHeatmap = (timeline) => {
    const rows = [
      {
        label: "Charge",
        toneClass: "tone-pink",
        max: Math.max(maxOf(timeline, (item) => item.trainingLoad), 1),
        display: (day) => `TL ${day.trainingLoad || 0}`,
        strength: (day, rowMax) => clamp((day.trainingLoad || 0) / rowMax, 0, 1),
      },
      {
        label: "Sommeil",
        toneClass: "tone-cyan",
        max: Math.max(maxOf(timeline, (item) => item.sleepHours), 1),
        display: (day) => `${num(day.sleepHours)} h`,
        strength: (day, rowMax) => clamp((day.sleepHours || 0) / rowMax, 0, 1),
      },
      {
        label: "BB",
        toneClass: "tone-purple",
        max: 100,
        display: (day) => `BB ${day.wakeBodyBattery ?? "--"}`,
        strength: (day) => clamp((day.wakeBodyBattery || 0) / 100, 0, 1),
      },
      {
        label: "Stress",
        toneClass: "tone-rose",
        max: 100,
        display: (day) => `Stress ${day.stress || 0}`,
        strength: (day) => clamp((100 - (day.stress || 0)) / 100, 0, 1),
      },
    ];

    return `
      <div class="sport-heatmap-head">
        <span class="sport-heatmap-corner">14 jours</span>
        <div class="sport-heatmap-days">
          ${timeline.map((day) => `<span>${esc(shortDay(day.date))}</span>`).join("")}
        </div>
      </div>
      <div class="sport-heatmap-grid">
        ${rows
          .map(
            (row) => `
              <div class="sport-heatmap-row ${row.toneClass}">
                <p class="sport-heatmap-row-label">${esc(row.label)}</p>
                <div class="sport-heatmap-cells">
                  ${timeline
                    .map((day) => {
                      const strength = row.strength(day, row.max);
                      return `<span class="sport-heatmap-cell" style="--cell-strength:${strength.toFixed(3)}" title="${esc(
                        `${shortDay(day.date)} - ${row.display(day)}`
                      )}"></span>`;
                    })
                    .join("")}
                </div>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="sport-heatmap-legend">
        <span>Calme</span>
        <span>Montee</span>
        <span>Pic</span>
      </div>
    `;
  };

  const buildMapSvg = (points, bounds) => {
    if (!points.length || !bounds) {
      return "";
    }

    const width = 540;
    const height = 320;
    const padding = 28;
    const lonSpan = Math.max(bounds.maxLon - bounds.minLon, 0.01);
    const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.01);
    const x = (lon) => padding + ((lon - bounds.minLon) / lonSpan) * (width - padding * 2);
    const y = (lat) => height - padding - ((lat - bounds.minLat) / latSpan) * (height - padding * 2);

    const grid = Array.from({ length: 5 }, (_item, index) => {
      const gx = padding + ((width - padding * 2) / 4) * index;
      const gy = padding + ((height - padding * 2) / 4) * index;
      return `
        <line x1="${gx}" y1="${padding}" x2="${gx}" y2="${height - padding}" class="sport-map-grid" />
        <line x1="${padding}" y1="${gy}" x2="${width - padding}" y2="${gy}" class="sport-map-grid" />
      `;
    }).join("");

    const routes = points
      .map((point, index) => {
        const x1 = x(point.startLongitude);
        const y1 = y(point.startLatitude);
        const x2 = x(point.endLongitude);
        const y2 = y(point.endLatitude);
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const normalX = -dy / distance;
        const normalY = dx / distance;
        const curve = Math.min(54, distance * 0.18 + 8);
        const cx = (x1 + x2) / 2 + normalX * curve;
        const cy = (y1 + y2) / 2 + normalY * curve;
        const opacity = Math.max(0.22, (points.length - index) / points.length);
        const path = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

        return `
          <g class="sport-map-route" style="--route-opacity:${opacity.toFixed(2)}">
            <path d="${path}" class="sport-map-arc glow" />
            <path d="${path}" class="sport-map-arc" />
            <circle cx="${x1}" cy="${y1}" r="${index === 0 ? 5.5 : 4}" class="sport-map-start" />
            <circle cx="${x2}" cy="${y2}" r="${index === 0 ? 4.5 : 3.2}" class="sport-map-end" />
          </g>
        `;
      })
      .join("");

    return `
      <svg viewBox="0 0 ${width} ${height}" class="sport-map-svg" aria-hidden="true">
        ${grid}
        ${routes}
      </svg>
    `;
  };

  const splitParagraphs = (value) =>
    String(value || "")
      .split(/\n+/)
      .map((part) => part.trim())
      .filter(Boolean);

  const buildHeroState = ({ sport, dominantSport, bestNight, featuredActivity }) => {
    const readinessScore = Math.round(
      clamp(
        Number(sport.sleep?.scoreAvg || 0) * 0.42 +
          Number(sport.recovery?.wakeBodyBatteryAvg || 0) * 0.38 +
          (100 - Number(sport.recovery?.stressAvg || 0)) * 0.2,
        0,
        100
      )
    );
    const sleepNeedHours = Number(sport.sleep?.sleepNeedAvgMinutes || 0) / 60;
    const sleepGap = Number(sport.sleep?.durationAvg || 0) - sleepNeedHours;
    const weeklyReference = Number(sport.recent28?.trainingLoad || 0) / 4;
    const loadDelta = weeklyReference ? Math.round(((Number(sport.recent7?.trainingLoad || 0) - weeklyReference) / weeklyReference) * 100) : 0;

    let headline = "Base correcte, a piloter finement";
    let shortLabel = "Equilibre";
    let toneClass = "tone-purple";

    if (readinessScore >= 75 && sleepGap >= -0.7) {
      headline = "Fenetre solide pour pousser";
      shortLabel = "Haute forme";
      toneClass = "tone-cyan";
    } else if (readinessScore <= 58 || sleepGap < -1.4) {
      headline = "Recuperation a proteger";
      shortLabel = "Reprise douce";
      toneClass = "tone-pink";
    }

    const dominantLabel = dominantSport ? dominantSport.label.toLowerCase() : "entrainement mixte";
    const focusName = featuredActivity ? featuredActivity.name : "derniere seance";
    const summary = `Readiness ${readinessScore}/100, charge 7 jours ${sport.recent7?.trainingLoad || 0}, sommeil moyen ${num(
      sport.sleep?.durationAvg
    )} h pour un besoin proche de ${num(sleepNeedHours)} h. La dominante reste ${dominantLabel} avec ${focusName.toLowerCase()} comme point chaud recent.`;

    return {
      readinessScore,
      sleepNeedHours,
      sleepGap,
      loadDelta,
      headline,
      shortLabel,
      toneClass,
      summary,
      bestNightLabel: bestNight ? `${bestNight.score || "--"}/100 le ${longDate(bestNight.date)}` : "Pas de nuit forte recente",
    };
  };

  const renderWeekColumns = (items) => {
    const maxDistance = Math.max.apply(
      null,
      items.map((item) => item.distanceKm || 0).concat([1])
    );

    return items
      .map(
        (item) => `
          <div class="sport-week-column">
            <div class="sport-week-bar">
              <div class="sport-week-fill" style="height:${Math.max(16, Math.round(((item.distanceKm || 0) / maxDistance) * 100))}%"></div>
            </div>
            <div class="sport-week-meta">
              <p class="sport-week-title">${esc(item.weekKey || shortDay(item.date))}</p>
              <p class="sport-week-note">${esc(`${num(item.distanceKm)} km - ${num(item.durationHours)} h`)}</p>
              <p class="sport-week-note">${esc(`TL ${item.trainingLoad} - ${item.activityCount} seances`)}</p>
            </div>
          </div>
        `
      )
      .join("");
  };

  const renderZoneBars = (items, valueLabel) =>
    items
      .map(
        (item) => `
          <div class="sport-zone-row">
            <div class="sport-zone-head">
              <p class="sport-zone-label">${esc(item.label)}</p>
              <p class="sport-zone-meta">${esc(`${item.sharePct || 0}% - ${num(item.durationHours)} h`)}</p>
            </div>
            <div class="sport-progress-track">
              <div class="sport-progress-fill" style="width:${Math.max(8, item.sharePct || 0)}%"></div>
            </div>
            <p class="sport-breakdown-note">${esc(`${item.activityCount || 0} seances - ${valueLabel} ${item.trainingLoad || 0}`)}</p>
          </div>
        `
      )
      .join("");

  const renderHourlyFrequency = (items) => {
    const maxCount = Math.max(maxOf(items, (item) => item.activityCount), 1);
    return `
      <div class="sport-hourly-chart">
        ${items
          .map(
            (item) => `
              <div class="sport-hourly-col">
                <div class="sport-hourly-bar">
                  <span class="sport-hourly-fill" style="height:${Math.max(
                    8,
                    Math.round(((item.activityCount || 0) / maxCount) * 100)
                  )}%"></span>
                </div>
                <p class="sport-hourly-label">${esc(String(item.hour).padStart(2, "0"))}</p>
              </div>
            `
          )
          .join("")}
      </div>
    `;
  };

  const renderRecordTimeline = (items) => `
    <div class="sport-record-timeline">
      ${items
        .map(
          (item) => `
            <article class="sport-record-timeline-item tone-${esc(item.tone || "purple")}">
              <p class="sport-soft-label">${esc(item.label)}</p>
              <p class="sport-record-timeline-value">${esc(item.value)}</p>
              <p class="sport-record-timeline-date">${esc(longDate(item.date))}</p>
              <p class="sport-metric-note">${esc(item.note)}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;

  const render = ({ sport, elements }) => {
    if (!sport) {
      elements.sportHeroBadges.innerHTML = '<span class="sport-pill">Resume Garmin indisponible</span>';
      elements.sportHeroSnapshot.innerHTML = `
        <div class="sport-soft-card">
          <p class="sport-soft-label">Sport</p>
          <p class="sport-soft-value">Aucun export Garmin local detecte.</p>
        </div>
      `;
      elements.sportOverviewMetrics.innerHTML = metricCard({
        label: "Sport",
        value: "--",
        note: "Ajoute ou relance les exports Garmin.",
      });
      [
        elements.sportWeeklyVolume,
        elements.sportLoadHistory,
        elements.sportGeography,
        elements.sportBreakdown,
        elements.sportWellnessHistory,
        elements.sportSleepStages,
        elements.sportPatterns,
        elements.sportRecords,
        elements.sportAiAnalysis,
      ].forEach((node) => {
        if (node) node.innerHTML = emptyPanel("Aucune donnee sport disponible.");
      });
      elements.sportActivities.innerHTML =
        '<article class="sport-soft-card"><p class="sport-soft-label">Aucune activite recente disponible.</p></article>';
      return;
    }

    const breakdown = sport.breakdown || [];
    const weeklyVolume = sport.weeklyVolume || [];
    const timeline = sport.dailyTimeline || [];
    const nights = sport.sleep?.recentNights || [];
    const mapPoints = sport.geography?.mapPoints || [];
    const topLocations = sport.geography?.topLocations || [];
    const activities = sport.recentActivities || [];
    const dominantSport = breakdown[0] || null;
    const bestNight = nights.reduce((best, night) => (!best || (night.score || 0) > (best.score || 0) ? night : best), null);
    const featuredActivity = activities[0] || sport.longestRun || sport.longestRide || null;
    const latestDay = timeline[timeline.length - 1] || null;
    const peakLoadDay = timeline.reduce(
      (best, day) => (!best || (day.trainingLoad || 0) > (best.trainingLoad || 0) ? day : best),
      null
    );
    const strongestRecoveryDay = timeline.reduce((best, day) => {
      const currentScore = Number(day.wakeBodyBattery || 0) + Number(day.sleepScore || 0) - Number(day.stress || 0);
      const bestScore = best ? Number(best.wakeBodyBattery || 0) + Number(best.sleepScore || 0) - Number(best.stress || 0) : -Infinity;
      return currentScore > bestScore ? day : best;
    }, null);
    const hero = buildHeroState({ sport, dominantSport, bestNight, featuredActivity });
    const sleepNeedHours = hero.sleepNeedHours;
    const usefulSleepPct = sleepNeedHours ? Math.round(clamp((Number(sport.sleep?.durationAvg || 0) / sleepNeedHours) * 100, 0, 100)) : 0;
    const trendLabels = timeline.map((day) => shortDay(day.date));
    const aiAnalysis = sport.aiAnalysis || null;
    const aiParagraphs = splitParagraphs(aiAnalysis && aiAnalysis.analysisText);
    const analytics = sport.analytics || {};
    const loadRatio = analytics.loadRatio7to28 != null ? Number(analytics.loadRatio7to28) : null;
    const sleepDebtHours = analytics.sleepDebtHours != null ? Number(analytics.sleepDebtHours) : null;
    const cardioZones = analytics.cardioZones || [];
    const powerZones = analytics.powerZones || [];
    const hourlyFrequency = analytics.activityFrequencyByHour || [];
    const recordTimeline = analytics.recordTimeline || [];

    elements.sportHeroBadges.innerHTML = [
      {
        label: "Etat",
        value: `${hero.readinessScore}/100`,
        note: hero.shortLabel,
        toneClass: hero.toneClass,
      },
      {
        label: "Charge 7 jours",
        value: `TL ${sport.recent7?.trainingLoad || 0}`,
        note: `${sport.recent7?.activityCount || 0} seances`,
        toneClass: "tone-pink",
      },
      {
        label: "Outdoor",
        value: `${sport.source?.outdoorCount || 0} sorties`,
        note: `${num(sport.patterns?.indoorOutdoor?.outdoorDistanceKm)} km`,
        toneClass: "tone-cyan",
      },
      {
        label: "Focus",
        value: dominantSport ? dominantSport.label : "Mix",
        note: featuredActivity ? featuredActivity.name : "Aucune seance",
        toneClass: "tone-purple",
      },
    ]
      .map(summaryBadge)
      .join("");

    elements.sportHeroSnapshot.innerHTML = `
      <article class="sport-hero-showcase ${hero.toneClass}">
        <div class="sport-hero-showcase-head">
          <div class="sport-hero-main-copy">
            <p class="sport-kicker">Focus du jour</p>
            <h3>${esc(hero.headline)}</h3>
            <p class="sport-showcase-copy">${esc(hero.summary)}</p>
          </div>
          <div class="sport-ring-cluster">
            ${ringGauge({
              value: hero.readinessScore,
              label: "Readiness",
              note: `${hero.shortLabel} sur la base sommeil + BB + stress`,
              toneClass: hero.toneClass,
            })}
            ${ringGauge({
              value: sport.recovery?.wakeBodyBatteryAvg || 0,
              label: "Body battery",
              note: `Moyenne reveil ${sport.recovery?.wakeBodyBatteryAvg || "--"}`,
              toneClass: "tone-cyan",
            })}
            ${ringGauge({
              value: usefulSleepPct,
              label: "Sommeil utile",
              note: `${num(sport.sleep?.durationAvg)} h pour un besoin de ${num(sleepNeedHours)} h`,
              toneClass: "tone-purple",
            })}
          </div>
        </div>
        <div class="sport-showcase-stat-grid">
          <article class="sport-showcase-stat tone-cyan">
            <p class="sport-soft-label">Derniere seance</p>
            <p class="sport-showcase-stat-value">${esc(featuredActivity ? featuredActivity.name : "Aucune")}</p>
            <p class="sport-showcase-stat-note">${esc(
              featuredActivity
                ? `${longDate(featuredActivity.dateLocal || featuredActivity.date)} - ${activityMetric(featuredActivity)} - TL ${
                    featuredActivity.trainingLoad || "--"
                  }`
                : "Pas d activite recente"
            )}</p>
          </article>
          <article class="sport-showcase-stat tone-pink">
            <p class="sport-soft-label">Nuit repere</p>
            <p class="sport-showcase-stat-value">${esc(hero.bestNightLabel)}</p>
            <p class="sport-showcase-stat-note">${esc(
              bestNight
                ? `${num(bestNight.durationHours)} h - HRV ${bestNight.overnightHrv ?? "--"} - stress ${bestNight.avgSleepStress ?? "--"}`
                : "Pas de nuit recente exploitable"
            )}</p>
          </article>
          <article class="sport-showcase-stat tone-purple">
            <p class="sport-soft-label">Delta de charge</p>
            <p class="sport-showcase-stat-value">${esc(`${hero.loadDelta >= 0 ? "+" : ""}${hero.loadDelta}%`)}</p>
            <p class="sport-showcase-stat-note">${esc(
              `Par rapport au rythme 28 jours. Sommeil ${hero.sleepGap >= 0 ? "+" : ""}${num(hero.sleepGap)} h vs besoin.`
            )}</p>
          </article>
        </div>
        <div class="sport-showcase-trend-card">
          <div class="sport-showcase-trend-head">
            <div>
              <p class="sport-soft-label">Charge recente</p>
              <p class="sport-showcase-trend-value">${esc(`${sport.recent7?.trainingLoad || 0} TL`)}</p>
            </div>
            <p class="sport-panel-note">${esc(peakLoadDay ? `Pic ${peakLoadDay.trainingLoad || 0} le ${shortDay(peakLoadDay.date)}` : "Pas de pic recent")}</p>
          </div>
          ${buildSparklineSvg({
            values: timeline.map((day) => day.trainingLoad || 0),
            colorStart: "#79ebff",
            colorEnd: "#b358ff",
            glowColor: "#79ebff",
            labels: trendLabels,
          })}
        </div>
      </article>
    `;

    elements.sportOverviewMetrics.innerHTML = [
      {
        label: "7 jours",
        value: `${num(sport.recent7?.distanceKm)} km`,
        note: `${num(sport.recent7?.durationHours)} h - TL ${sport.recent7?.trainingLoad || "--"}`,
        toneClass: "tone-cyan",
      },
      {
        label: "Sommeil moyen",
        value: `${sport.sleep?.scoreAvg || "--"}/100`,
        note: `${num(sport.sleep?.durationAvg)} h - besoin ${num(sleepNeedHours)} h`,
        toneClass: "tone-purple",
      },
      {
        label: "Body battery",
        value: `${sport.recovery?.wakeBodyBatteryAvg || "--"}`,
        note: `Stress ${sport.recovery?.stressAvg || "--"} - FC repos ${sport.recovery?.restingHeartRateAvg || "--"}`,
        toneClass: "tone-pink",
      },
      {
        label: "Ratio charge",
        value: loadRatio != null ? `${num(loadRatio, 2)}x` : "--",
        note:
          sleepDebtHours != null
            ? `Dette sommeil ${num(sleepDebtHours)} h - VO2 ${sport.performance?.vo2Max ?? "--"}`
            : `${sport.source?.outdoorCount || 0} sorties outdoor - ${sport.overview?.outdoorShare || 0}% du volume`,
        toneClass: "tone-gold",
      },
    ]
      .map(metricCard)
      .join("");

    elements.sportWeeklyVolume.innerHTML = weeklyVolume.length
      ? `
          <div class="sport-panel-head">
            <div>
              <p class="sport-kicker">Charge</p>
              <h3>Volume hebdomadaire</h3>
            </div>
            <p class="sport-panel-note">Distance, duree, charge et nombre de seances.</p>
          </div>
          <div class="sport-panel-strip">
            <span class="sport-pill">${esc(`${weeklyVolume.length} semaines visibles`)}</span>
            <span class="sport-pill">${esc(`${num(averageOf(weeklyVolume, (week) => week.distanceKm))} km / semaine`)}</span>
            <span class="sport-pill">${esc(`TL moyen ${Math.round(averageOf(weeklyVolume, (week) => week.trainingLoad))}`)}</span>
            ${loadRatio != null ? `<span class="sport-pill">${esc(`ratio 7j/28j ${num(loadRatio, 2)}x`)}</span>` : ""}
          </div>
          <div class="sport-week-grid">${renderWeekColumns(weeklyVolume)}</div>
        `
      : emptyPanel("Aucun volume hebdomadaire disponible.");

    elements.sportLoadHistory.innerHTML = timeline.length
      ? `
          <div class="sport-panel-head">
            <div>
              <p class="sport-kicker">Courbes</p>
              <h3>Charge et sommeil</h3>
            </div>
            <p class="sport-panel-note">Deux lectures douces pour suivre la montee de charge et la qualite de recup.</p>
          </div>
          <div class="sport-trend-grid">
            <article class="sport-trend-card tone-pink">
              <div class="sport-trend-head">
                <div>
                  <p class="sport-soft-label">Training load quotidien</p>
                  <h4>${esc(`${latestDay?.trainingLoad || 0} TL aujourd hui`)}</h4>
                </div>
                <p class="sport-panel-note">${esc(peakLoadDay ? `Pic ${peakLoadDay.trainingLoad || 0} le ${shortDay(peakLoadDay.date)}` : "Pas de pic")}</p>
              </div>
              ${buildSparklineSvg({
                values: timeline.map((day) => day.trainingLoad || 0),
                colorStart: "#ff73d8",
                colorEnd: "#79ebff",
                glowColor: "#ff73d8",
                labels: trendLabels,
              })}
              <div class="sport-trend-footer">
                <span class="sport-pill">${esc(`Moyenne ${Math.round(averageOf(timeline, (day) => day.trainingLoad))} TL`)}</span>
                <span class="sport-pill">${esc(`${num(averageOf(timeline, (day) => day.distanceKm))} km / jour`)}</span>
              </div>
            </article>
            <article class="sport-trend-card tone-cyan">
              <div class="sport-trend-head">
                <div>
                  <p class="sport-soft-label">Sommeil quotidien</p>
                  <h4>${esc(`${num(latestDay?.sleepHours)} h sur la derniere nuit`)}</h4>
                </div>
                <p class="sport-panel-note">${esc(bestNight ? `Meilleure nuit ${bestNight.score || "--"}/100` : "Pas de meilleure nuit")}</p>
              </div>
              ${buildSparklineSvg({
                values: timeline.map((day) => day.sleepHours || 0),
                colorStart: "#79ebff",
                colorEnd: "#b358ff",
                glowColor: "#79ebff",
                labels: trendLabels,
              })}
              <div class="sport-trend-footer">
                <span class="sport-pill">${esc(`Moyenne ${num(averageOf(timeline, (day) => day.sleepHours))} h`)}</span>
                <span class="sport-pill">${esc(`Besoin ${num(sleepNeedHours)} h`)}</span>
              </div>
            </article>
          </div>
        `
      : emptyPanel("Aucun historique recent disponible.");

    elements.sportGeography.innerHTML = mapPoints.length
      ? `
          <div class="sport-panel-head">
            <div>
              <p class="sport-kicker">GPS outdoor</p>
              <h3>Empreinte des sorties</h3>
            </div>
            <p class="sport-panel-note">Trajets stylises pour voir ou la charge exterieure se concentre.</p>
          </div>
          <div class="sport-geo-grid">
            <div class="sport-map-wrap">${buildMapSvg(mapPoints, sport.geography.bounds)}</div>
            <div class="sport-location-list">
              <div class="sport-soft-card tone-cyan">
                <p class="sport-soft-label">Top spots</p>
                <div class="sport-list-stack">
                  ${topLocations
                    .map(
                      (location) => `
                        <div class="sport-list-row">
                          <div>
                            <p class="sport-list-title">${esc(location.name)}</p>
                            <p class="sport-list-note">${esc(`${location.count} sorties - ${num(location.durationHours)} h`)}</p>
                          </div>
                          <span class="sport-list-value">${esc(`${num(location.distanceKm)} km`)}</span>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              </div>
              <div class="sport-soft-card tone-purple">
                <p class="sport-soft-label">Lecture rapide</p>
                <p class="sport-soft-value">${esc(`${sport.source?.outdoorCount || 0} activites outdoor`)}</p>
                <p class="sport-metric-note">${esc(
                  `${num(sport.patterns?.indoorOutdoor?.outdoorDistanceKm)} km dehors pour ${num(sport.overview?.outdoorShare, 0)}% du volume total.`
                )}</p>
              </div>
            </div>
          </div>
        `
      : emptyPanel("Aucune coordonnee GPS outdoor disponible.");

    elements.sportBreakdown.innerHTML = breakdown.length
      ? `
          <div class="sport-panel-head">
            <div>
              <p class="sport-kicker">Zones</p>
              <h3>Cardio, puissance et sports</h3>
            </div>
            <p class="sport-panel-note">Lecture combinee des zones moyennes et de la repartition globale.</p>
          </div>
          <div class="sport-zone-grid">
            <article class="sport-soft-card tone-cyan">
              <p class="sport-soft-label">Zones cardio</p>
              <div class="sport-zone-list">
                ${renderZoneBars(cardioZones, "TL")}
              </div>
            </article>
            <article class="sport-soft-card tone-purple">
              <p class="sport-soft-label">Zones puissance</p>
              <div class="sport-zone-list">
                ${renderZoneBars(powerZones, "TL")}
              </div>
            </article>
          </div>
          <div class="sport-breakdown-list">
            ${breakdown
              .map(
                (item) => `
                  <div class="sport-breakdown-item">
                    <div class="sport-breakdown-head">
                      <p class="sport-breakdown-name">${esc(item.label)}</p>
                      <p class="sport-breakdown-value">${esc(`${num(item.distanceKm)} km`)}</p>
                    </div>
                    <div class="sport-progress-track">
                      <div class="sport-progress-fill" style="width:${Math.max(
                        8,
                        Math.round(((item.distanceKm || 0) / Math.max(maxOf(breakdown, (entry) => entry.distanceKm), 1)) * 100)
                      )}%"></div>
                    </div>
                    <p class="sport-breakdown-note">${esc(
                      `${item.count} seances - ${num(item.durationHours)} h - TL ${item.trainingLoad} - in/out ${item.indoorCount}/${item.outdoorCount}`
                    )}</p>
                  </div>
                `
              )
              .join("")}
          </div>
        `
      : emptyPanel("Aucune repartition disponible.");

    elements.sportWellnessHistory.innerHTML = timeline.length
      ? `
          <div class="sport-panel-head">
            <div>
              <p class="sport-kicker">14 jours</p>
              <h3>Heatmap recovery</h3>
            </div>
            <p class="sport-panel-note">Une lecture compacte de la charge, du sommeil, du body battery et du stress.</p>
          </div>
          <div class="sport-heatmap-shell">
            ${buildHeatmap(timeline)}
          </div>
          <div class="sport-spotlight-grid">
            <article class="sport-soft-card tone-pink">
              <p class="sport-soft-label">Jour le plus charge</p>
              <p class="sport-soft-value">${esc(peakLoadDay ? shortDay(peakLoadDay.date) : "--")}</p>
              <p class="sport-metric-note">${esc(
                peakLoadDay ? `TL ${peakLoadDay.trainingLoad || 0} - ${num(peakLoadDay.distanceKm)} km - ${peakLoadDay.activityCount || 0} act.` : "Pas de jour charge"
              )}</p>
            </article>
            <article class="sport-soft-card tone-cyan">
              <p class="sport-soft-label">Jour le plus propre</p>
              <p class="sport-soft-value">${esc(strongestRecoveryDay ? shortDay(strongestRecoveryDay.date) : "--")}</p>
              <p class="sport-metric-note">${esc(
                strongestRecoveryDay
                  ? `BB ${strongestRecoveryDay.wakeBodyBattery ?? "--"} - sommeil ${num(strongestRecoveryDay.sleepHours)} h - stress ${strongestRecoveryDay.stress || 0}`
                  : "Pas de jour de reference"
              )}</p>
            </article>
            <article class="sport-soft-card tone-purple">
              <p class="sport-soft-label">Dette sommeil</p>
              <p class="sport-soft-value">${esc(sleepDebtHours != null ? `${num(sleepDebtHours)} h` : "--")}</p>
              <p class="sport-metric-note">${esc(
                latestDay
                  ? `Dernier point ${shortDay(latestDay.date)} - TL ${latestDay.trainingLoad || 0} - ${num(latestDay.sleepHours)} h`
                  : "Pas de dernier point"
              )}</p>
            </article>
          </div>
        `
      : emptyPanel("Aucun historique bien-etre disponible.");

    elements.sportSleepStages.innerHTML = nights.length
      ? `
          <div class="sport-panel-head">
            <div>
              <p class="sport-kicker">Sommeil</p>
              <h3>Structure des nuits recentes</h3>
            </div>
            <p class="sport-panel-note">Carte premium sommeil: score, structure, HRV et stress nocturne.</p>
          </div>
          <div class="sport-sleep-summary-grid">
            <article class="sport-soft-card tone-purple">
              <p class="sport-soft-label">Score moyen</p>
              <p class="sport-soft-value">${esc(`${sport.sleep?.scoreAvg || "--"}/100`)}</p>
              <p class="sport-metric-note">${esc(bestNight ? `Pic ${bestNight.score || "--"}/100 le ${longDate(bestNight.date)}` : "Pas de pic recent")}</p>
            </article>
            <article class="sport-soft-card tone-cyan">
              <p class="sport-soft-label">Duree moyenne</p>
              <p class="sport-soft-value">${esc(`${num(sport.sleep?.durationAvg)} h`)}</p>
              <p class="sport-metric-note">${esc(`Besoin moyen ${num(sleepNeedHours)} h`)}</p>
            </article>
            <article class="sport-soft-card tone-pink">
              <p class="sport-soft-label">HRV moyen</p>
              <p class="sport-soft-value">${esc(`${sport.sleep?.hrvAvg || "--"}`)}</p>
              <p class="sport-metric-note">${esc(`Stress nocturne ${sport.sleep?.stressAvg || "--"}`)}</p>
            </article>
          </div>
          <div class="sport-sleep-grid">
            ${nights
              .map((night) => {
                const awakeHours = (night.awakeMinutes || 0) / 60;
                const total = Math.max((night.deepHours || 0) + (night.lightHours || 0) + (night.remHours || 0) + awakeHours, 0.1);
                return `
                  <article class="sport-sleep-card">
                    <div class="sport-sleep-head">
                      <div>
                        <p class="sport-sleep-date">${esc(longDate(night.date))}</p>
                        <p class="sport-sleep-score">${esc(`${night.score || "--"}/100`)}</p>
                      </div>
                      <span class="sport-chip">${esc(sleepScoreLabels[night.scoreLabel] || night.scoreLabel || "Nuit")}</span>
                    </div>
                    <div class="sport-stage-strip">
                      <span class="sport-stage-fill deep" style="width:${((night.deepHours || 0) / total) * 100}%"></span>
                      <span class="sport-stage-fill light" style="width:${((night.lightHours || 0) / total) * 100}%"></span>
                      <span class="sport-stage-fill rem" style="width:${((night.remHours || 0) / total) * 100}%"></span>
                      <span class="sport-stage-fill awake" style="width:${(awakeHours / total) * 100}%"></span>
                    </div>
                    <div class="sport-sleep-meta">
                      <p>${esc(`${num(night.durationHours)} h - profond ${num(night.deepHours)} h - REM ${num(night.remHours)} h`)}</p>
                      <p>${esc(`HRV ${night.overnightHrv ?? "--"} - stress ${night.avgSleepStress ?? "--"} - FC ${night.avgHeartRate || "--"} bpm`)}</p>
                      <p>${esc(`SpO2 ${night.avgSpO2 ?? "--"} - sieste ${night.napMinutes || 0} min - besoin ${night.sleepNeedActualMinutes || "--"} min`)}</p>
                    </div>
                  </article>
                `;
              })
              .join("")}
          </div>
        `
      : emptyPanel("Aucune nuit recente disponible.");

    elements.sportPatterns.innerHTML = `
      <div class="sport-panel-head">
        <div>
          <p class="sport-kicker">Patterns</p>
          <h3>Routine d entrainement</h3>
        </div>
        <p class="sport-panel-note">Quand le volume se pose dans la semaine et dans la journee.</p>
      </div>
      <div class="sport-pattern-grid">
        <div class="sport-soft-card tone-purple">
          <p class="sport-soft-label">Par jour</p>
          <div class="sport-list-stack">
            ${(sport.patterns?.weekday || [])
              .map(
                (item) => `
                  <div>
                    <div class="sport-breakdown-head">
                      <p class="sport-breakdown-name">${esc(item.label)}</p>
                      <p class="sport-breakdown-value">${esc(`${num(item.distanceKm)} km`)}</p>
                    </div>
                    <div class="sport-progress-track"><div class="sport-progress-fill" style="width:${Math.max(
                      8,
                      Math.round(((item.distanceKm || 0) / Math.max(maxOf(sport.patterns?.weekday || [], (entry) => entry.distanceKm), 1)) * 100)
                    )}%"></div></div>
                    <p class="sport-breakdown-note">${esc(`${item.activityCount} seances - TL ${item.trainingLoad}`)}</p>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
        <div class="sport-soft-card tone-cyan">
          <p class="sport-soft-label">Frequence par heure</p>
          ${renderHourlyFrequency(hourlyFrequency)}
          <p class="sport-soft-label">Moments de la journee</p>
          <div class="sport-list-stack">
            ${(sport.patterns?.dayPart || [])
              .map(
                (item) => `
                  <div class="sport-list-row">
                    <div>
                      <p class="sport-list-title">${esc(item.label)}</p>
                      <p class="sport-list-note">${esc(`${item.activityCount} seances - TL ${item.trainingLoad}`)}</p>
                    </div>
                    <span class="sport-list-value">${esc(`${num(item.distanceKm)} km`)}</span>
                  </div>
                `
              )
              .join("")}
          </div>
          <div class="sport-inline-stats">
            <span class="sport-pill">Indoor ${esc(String(sport.patterns?.indoorOutdoor?.indoorCount || 0))}</span>
            <span class="sport-pill">Outdoor ${esc(String(sport.patterns?.indoorOutdoor?.outdoorCount || 0))}</span>
            <span class="sport-pill">Dehors ${esc(`${num(sport.patterns?.indoorOutdoor?.outdoorDistanceKm)} km`)}</span>
            ${loadRatio != null ? `<span class="sport-pill">Ratio ${esc(`${num(loadRatio, 2)}x`)}</span>` : ""}
          </div>
        </div>
      </div>
    `;

    const highlightRecords = [
      {
        label: "VO2 max",
        value: sport.performance?.vo2Max ?? "--",
        note: "Indice a garder haut pour la course.",
        toneClass: "tone-purple",
      },
      {
        label: "Record 10 km",
        value: sport.performance?.best10kSec ? clock(sport.performance.best10kSec) : "--",
        note: sport.performance?.best10kDate ? longDate(sport.performance.best10kDate) : "Date indisponible",
        toneClass: "tone-cyan",
      },
      {
        label: "Charge max",
        value: sport.performance?.highestTrainingLoad?.value ?? "--",
        note: sport.performance?.highestTrainingLoad
          ? `${longDate(sport.performance.highestTrainingLoad.date)} - ${sport.performance.highestTrainingLoad.name}`
          : "Indisponible",
        toneClass: "tone-pink",
      },
      {
        label: "Vitesse max",
        value: sport.performance?.highestSpeed?.value ? `${num(sport.performance.highestSpeed.value)} km/h` : "--",
        note: sport.performance?.highestSpeed
          ? `${longDate(sport.performance.highestSpeed.date)} - ${sport.performance.highestSpeed.name}`
          : "Indisponible",
        toneClass: "tone-gold",
      },
    ];

    const secondaryRecords = [
      ["Record 1 km", sport.performance?.best1kSec ? clock(sport.performance.best1kSec) : "--", sport.performance?.best1kDate ? longDate(sport.performance.best1kDate) : "Date indisponible"],
      ["Record 5 km", sport.performance?.best5kSec ? clock(sport.performance.best5kSec) : "--", sport.performance?.best5kDate ? longDate(sport.performance.best5kDate) : "Date indisponible"],
      ["Pic cardio", sport.performance?.highestHeartRate?.value ? `${sport.performance.highestHeartRate.value} bpm` : "--", sport.performance?.highestHeartRate ? `${longDate(sport.performance.highestHeartRate.date)} - ${sport.performance.highestHeartRate.name}` : "Indisponible"],
      ["Puissance max", sport.performance?.highestPower?.value ? `${sport.performance.highestPower.value} W` : "--", sport.performance?.highestPower ? `${longDate(sport.performance.highestPower.date)} - ${sport.performance.highestPower.name}` : "Indisponible"],
      ["Plus longue course", sport.longestRun ? `${num(sport.longestRun.distanceKm)} km` : "--", sport.longestRun ? `${longDate(sport.longestRun.dateLocal)} - ${pace(sport.longestRun.paceSecPerKm)}` : "Aucune course"],
      ["Plus longue sortie velo", sport.longestRide ? `${num(sport.longestRide.distanceKm)} km` : "--", sport.longestRide ? `${longDate(sport.longestRide.dateLocal)} - ${minutesLabel(sport.longestRide.durationMin)}` : "Aucun velo"],
    ];

    elements.sportRecords.innerHTML = `
      <div class="sport-panel-head">
        <div>
          <p class="sport-kicker">Records</p>
          <h3>Capsules premium</h3>
        </div>
        <p class="sport-panel-note">Les vraies pieces fortes remontent en premier.</p>
      </div>
      <div class="sport-record-highlight-grid">
        ${highlightRecords
          .map(
            (record) => `
              <article class="sport-record-hero ${record.toneClass}">
                <p class="sport-soft-label">${esc(record.label)}</p>
                <p class="sport-record-hero-value">${esc(String(record.value))}</p>
                <p class="sport-metric-note">${esc(record.note)}</p>
              </article>
            `
          )
          .join("")}
      </div>
      ${recordTimeline.length ? renderRecordTimeline(recordTimeline) : ""}
      <div class="sport-record-grid">
        ${secondaryRecords
          .map(
            ([label, value, note]) => `
              <article class="sport-soft-card sport-record-card">
                <p class="sport-soft-label">${esc(label)}</p>
                <p class="sport-record-value">${esc(String(value))}</p>
                <p class="sport-metric-note">${esc(note)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    `;

    elements.sportAiAnalysis.innerHTML =
      aiAnalysis && aiAnalysis.analysisText
        ? `
            <div class="sport-panel-head">
              <div>
                <p class="sport-kicker">Coach Ollama</p>
                <h3>Analyse brute du jour</h3>
              </div>
              <p class="sport-panel-note">${esc(`Export ${aiAnalysis.exportName || "--"}${aiAnalysis.model ? ` - modele ${aiAnalysis.model}` : ""}`)}</p>
            </div>
            <div class="sport-ai-shell">
              ${
                aiAnalysis.coachSignals
                  ? `
                      <div class="sport-ai-signal-grid">
                        <article class="sport-soft-card tone-pink">
                          <p class="sport-soft-label">Alerte du jour</p>
                          <p class="sport-soft-value">${esc(aiAnalysis.coachSignals.alert || "Aucune alerte")}</p>
                        </article>
                        <article class="sport-soft-card tone-cyan">
                          <p class="sport-soft-label">Conseil du jour</p>
                          <p class="sport-soft-value">${esc(aiAnalysis.coachSignals.advice || "Aucun conseil")}</p>
                        </article>
                        <article class="sport-soft-card tone-purple">
                          <p class="sport-soft-label">Seance de demain</p>
                          <p class="sport-soft-value">${esc(aiAnalysis.coachSignals.tomorrowWorkout || "Aucune suggestion")}</p>
                        </article>
                        <article class="sport-soft-card tone-gold">
                          <p class="sport-soft-label">Risque fatigue</p>
                          <p class="sport-soft-value">${esc(aiAnalysis.coachSignals.fatigueRisk || "--")}</p>
                          <p class="sport-metric-note">${esc(aiAnalysis.coachSignals.focus || "Pas de focus dedie")}</p>
                        </article>
                      </div>
                    `
                  : ""
              }
              <div class="sport-ai-meta">
                <span class="sport-pill">${esc(`Genere le ${longDate(aiAnalysis.generatedAt || aiAnalysis.exportName)}`)}</span>
                ${aiAnalysis.model ? `<span class="sport-pill">${esc(aiAnalysis.model)}</span>` : ""}
              </div>
              ${aiParagraphs.length ? `<div class="sport-ai-lead">${esc(aiParagraphs[0])}</div>` : ""}
              <pre class="sport-ai-content">${esc(aiAnalysis.analysisText)}</pre>
            </div>
          `
        : `
            <div class="sport-panel-head">
              <div>
                <p class="sport-kicker">Coach Ollama</p>
                <h3>Analyse brute du jour</h3>
              </div>
            </div>
            <p class="sport-soft-label">Aucune analyse Ollama disponible pour l instant. Le texte apparaitra ici apres l execution planifiee de 00:15.</p>
          `;

    elements.sportActivities.innerHTML = activities.length
      ? activities
          .map(
            (activity) => `
              <article class="sport-activity-card">
                <div class="sport-activity-top">
                  <div>
                    <p class="sport-activity-date">${esc(`${longDate(activity.dateLocal || activity.date)}${activity.locationName ? ` - ${activity.locationName}` : ""}`)}</p>
                    <p class="sport-activity-name">${esc(activity.name)}</p>
                  </div>
                  <span class="sport-chip">${esc(activityTypeLabel(activity.typeKey))}</span>
                </div>
                <div class="sport-activity-stats sport-activity-stats-rich">
                  <div class="sport-stat-box"><p class="sport-stat-label">Volume</p><p class="sport-stat-value">${esc(`${num(activity.distanceKm)} km`)}</p></div>
                  <div class="sport-stat-box"><p class="sport-stat-label">Duree</p><p class="sport-stat-value">${esc(`${minutesLabel(activity.durationMin)} - ${minutesLabel(activity.movingDurationMin || activity.durationMin)}`)}</p></div>
                  <div class="sport-stat-box"><p class="sport-stat-label">Allure / vitesse</p><p class="sport-stat-value">${esc(activityMetric(activity))}</p></div>
                  <div class="sport-stat-box"><p class="sport-stat-label">Charge</p><p class="sport-stat-value">${esc(`${activity.trainingLoad || "--"} - ${effect(activity.trainingEffect)}`)}</p></div>
                  <div class="sport-stat-box"><p class="sport-stat-label">Cardio</p><p class="sport-stat-value">${esc(`${activity.averageHr || "--"} / ${activity.maxHr || "--"} bpm`)}</p></div>
                  <div class="sport-stat-box"><p class="sport-stat-label">Puissance</p><p class="sport-stat-value">${esc(`${activity.avgPower || 0} / ${activity.maxPower || 0} W`)}</p></div>
                  <div class="sport-stat-box"><p class="sport-stat-label">Cadence</p><p class="sport-stat-value">${esc(`${activity.averageCadence || "--"} / ${activity.maxCadence || "--"}`)}</p></div>
                  <div class="sport-stat-box"><p class="sport-stat-label">Stamina / BB</p><p class="sport-stat-value">${esc(`${activity.minAvailableStamina ?? "--"} - BB ${activity.differenceBodyBattery ?? "--"}`)}</p></div>
                </div>
                <div class="sport-inline-stats">
                  <span class="sport-pill">${esc(`${activity.steps || 0} pas`)}</span>
                  ${activity.normalizedPower ? `<span class="sport-pill">NP ${esc(String(activity.normalizedPower))}</span>` : ""}
                  ${activity.averageTemperatureC ? `<span class="sport-pill">${esc(`${num(activity.averageTemperatureC)} deg C`)}</span>` : ""}
                  ${activity.waterEstimatedMl ? `<span class="sport-pill">${esc(`${activity.waterEstimatedMl} ml`)}</span>` : ""}
                  ${activity.recoveryHeartRate ? `<span class="sport-pill">RHR ${esc(String(activity.recoveryHeartRate))}</span>` : ""}
                  ${activity.aerobicTrainingEffect ? `<span class="sport-pill">TE ${esc(String(activity.aerobicTrainingEffect))}/${esc(String(activity.anaerobicTrainingEffect || 0))}</span>` : ""}
                </div>
                ${
                  activity.splitPreview && activity.splitPreview.length
                    ? `
                        <div class="sport-interval-list">
                          ${activity.splitPreview
                            .map(
                              (split) => `
                                <div class="sport-interval-item">
                                  <div class="sport-interval-head">
                                    <span>${esc(split.label)}</span>
                                    <strong>${esc(`${num(split.distanceKm, 2)} km - ${minutesLabel(split.durationMin)}`)}</strong>
                                  </div>
                                  <div class="sport-progress-track"><div class="sport-progress-fill" style="width:${Math.max(
                                    8,
                                    Math.round(((split.durationMin || 0) / Math.max(maxOf(activity.splitPreview, (entry) => entry.durationMin), 1)) * 100)
                                  )}%"></div></div>
                                  <p class="sport-breakdown-note">${esc(
                                    `${split.averageSpeedKmh ? `${num(split.averageSpeedKmh)} km/h` : "--"} - HR ${split.averageHr || "--"} - P ${split.averagePower || "--"}`
                                  )}</p>
                                </div>
                              `
                            )
                            .join("")}
                        </div>
                      `
                    : ""
                }
              </article>
            `
          )
          .join("")
      : '<article class="sport-soft-card"><p class="sport-soft-label">Aucune activite recente disponible.</p></article>';
  };

  window.SportDashboard = {
    render,
  };
})();
