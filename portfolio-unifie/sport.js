document.addEventListener("DOMContentLoaded", () => {
    const summary = window.__GARMIN_SUMMARY__;
    const byId = (id) => document.getElementById(id);
    const nodes = {
        heroBadges: byId("hero-badges"),
        heroSnapshot: byId("hero-snapshot"),
        overviewMetrics: byId("overview-metrics"),
        overviewSource: byId("overview-source"),
        overviewHighlights: byId("overview-highlights"),
        trainingRecords: byId("training-records"),
        trainingWeekly: byId("training-weekly"),
        trainingBreakdown: byId("training-breakdown"),
        sleepMetrics: byId("sleep-metrics"),
        sleepNights: byId("sleep-nights"),
        wellnessHistory: byId("wellness-history"),
        activitiesList: byId("activities-list"),
    };

    const typeLabels = {
        running: "Course",
        treadmill_running: "Tapis",
        trail_running: "Trail",
        cycling: "Cyclisme",
        road_biking: "Route",
        virtual_ride: "Home trainer",
    };

    const sleepScoreLabels = { POOR: "Faible", FAIR: "Correct", GOOD: "Bon", EXCELLENT: "Excellent" };
    const hrvStatusLabels = { BALANCED: "Equilibree", UNBALANCED: "Desequilibree", LOW: "Basse", NORMAL: "Normale" };

    const esc = (value = "") =>
        String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    const num = (value, digits = 1) =>
        Number(value || 0).toLocaleString("fr-FR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: digits,
        });

    const date = (isoDate) =>
        isoDate
            ? new Date(`${isoDate}T12:00:00`).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
              })
            : "--";

    const clock = (seconds) => {
        if (seconds == null) return "--";
        const total = Math.round(seconds);
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const remain = total % 60;
        return hours
            ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`
            : `${minutes}:${String(remain).padStart(2, "0")}`;
    };

    const hoursLabel = (hours) => {
        const safe = Number(hours || 0);
        const whole = Math.floor(safe);
        const minutes = Math.round((safe - whole) * 60);
        return whole ? `${whole} h ${String(minutes).padStart(2, "0")}` : `${minutes} min`;
    };

    const minutesLabel = (minutes) => {
        const safe = Math.round(minutes || 0);
        const whole = Math.floor(safe / 60);
        const remain = safe % 60;
        return whole ? `${whole} h ${String(remain).padStart(2, "0")}` : `${remain} min`;
    };

    const pace = (secondsPerKm) => (secondsPerKm ? `${clock(secondsPerKm)} /km` : "--");
    const exportDate = (value) => (value ? date(value.slice(0, 10)) : "--");
    const activityDate = (activity) => activity?.dateLocal || activity?.date || null;
    const activityType = (activity) => activity?.typeKey || activity?.type || "activity";
    const isBike = (typeKey = "") => typeKey.includes("cycl") || typeKey.includes("bike") || typeKey.includes("ride");
    const activityMetric = (activity) => {
        if (isBike(activity.typeKey)) {
            const speed = activity.durationHours ? activity.distanceKm / activity.durationHours : 0;
            return `${num(speed)} km/h`;
        }
        return pace(activity.paceSecPerKm);
    };

    const effect = (value) =>
        value
            ? value
                  .toLowerCase()
                  .split("_")
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" ")
            : "Seance";

    const tone = (score) => {
        if ((score || 0) >= 75) return "border-mint/30 bg-mint/10 text-mint";
        if ((score || 0) >= 60) return "border-accent/30 bg-accent/10 text-accent";
        if ((score || 0) >= 45) return "border-warm/30 bg-warm/10 text-warm";
        return "border-rose-400/30 bg-rose-400/10 text-rose-300";
    };

    const metricCard = (label, value, note, icon) => `
        <article class="card rounded-3xl p-6">
            <div class="flex items-center justify-between gap-4 mb-5">
                <p class="text-slate-400 text-sm uppercase tracking-[0.14em]">${esc(label)}</p>
                <span class="w-11 h-11 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                    <i class="fas ${esc(icon)}"></i>
                </span>
            </div>
            <p class="font-display text-4xl text-white font-bold mb-3">${esc(value)}</p>
            <p class="text-slate-400 text-sm leading-relaxed">${esc(note)}</p>
        </article>
    `;

    const panel = (message) => `
        <article class="card rounded-3xl p-6">
            <p class="text-slate-300">${esc(message)}</p>
        </article>
    `;

    if (!summary) {
        Object.values(nodes).forEach((node) => {
            if (node) node.innerHTML = panel("Les donnees Garmin ne sont pas disponibles.");
        });
        return;
    }

    const breakdown = summary.breakdown || [];
    const weeklyVolume = summary.weeklyVolume || [];
    const recentNights = [...(summary.sleep?.recentNights || [])].reverse();
    const dailyHistory = [...(summary.dailyHistory || [])].reverse();
    const recentActivities = summary.recentActivities || [];
    const dominantSport = breakdown[0];
    const peakLoad = summary.performance?.highestTrainingLoad;
    const bestNight = recentNights.reduce((best, night) => (!best || (night.score || 0) > (best.score || 0) ? night : best), null);
    const worstNight = recentNights.reduce((worst, night) => (!worst || (night.score || 100) < (worst.score || 100) ? night : worst), null);
    const totals = breakdown.reduce(
        (accumulator, item) => ({
            distanceKm: accumulator.distanceKm + (item.distanceKm || 0),
            durationHours: accumulator.durationHours + (item.durationHours || 0),
            elevationM: accumulator.elevationM + (item.elevationM || 0),
        }),
        { distanceKm: 0, durationHours: 0, elevationM: 0 }
    );
    const recentIntensityMinutes = dailyHistory.reduce(
        (total, day) => total + (day.moderateMinutes || 0) + (day.vigorousMinutes || 0),
        0
    );
    const weeklyMax = Math.max(...weeklyVolume.map((week) => week.distanceKm || 0), 1);

    if (nodes.heroBadges) {
        nodes.heroBadges.innerHTML = [
            `Derniere activite ${date(summary.source?.latestActivityDate)}`,
            `${summary.source?.activityCount || 0} activites`,
            `${summary.source?.dailyCount || 0} jours bien-etre`,
            `${summary.source?.sleepCount || 0} nuits sommeil`,
            `${summary.performance?.vo2Max ?? "--"} VO2 max`,
        ]
            .map((label) => `<span class="px-3 py-2 rounded-full bg-slate-900/70 border border-slate-800">${esc(label)}</span>`)
            .join("");
    }

    if (nodes.heroSnapshot) {
        nodes.heroSnapshot.innerHTML = `
            <div class="rounded-2xl bg-slate-950/55 border border-slate-800 p-4">
                <p class="text-sm text-slate-400 mb-1">Volume cumule</p>
                <p class="text-white font-semibold">${esc(`${num(totals.distanceKm)} km - ${num(totals.durationHours)} h`)}</p>
            </div>
            <div class="rounded-2xl bg-slate-950/55 border border-slate-800 p-4">
                <p class="text-sm text-slate-400 mb-1">Fenetre 28 jours</p>
                <p class="text-white font-semibold">${esc(`${num(summary.recent28?.distanceKm)} km en ${num(summary.recent28?.durationHours)} h`)}</p>
            </div>
            <div class="rounded-2xl bg-slate-950/55 border border-slate-800 p-4">
                <p class="text-sm text-slate-400 mb-1">Sommeil et HRV</p>
                <p class="text-white font-semibold">${esc(`${num(summary.sleep?.durationAvg)} h - HRV ${summary.sleep?.hrvAvg ?? "--"}`)}</p>
            </div>
            <div class="rounded-2xl bg-slate-950/55 border border-slate-800 p-4">
                <p class="text-sm text-slate-400 mb-1">Dominante</p>
                <p class="text-white font-semibold">${dominantSport ? `${esc(dominantSport.label)} - ${esc(`${num(dominantSport.distanceKm)} km`)}` : "Dominante indisponible"}</p>
            </div>
        `;
    }

    if (nodes.overviewMetrics) {
        nodes.overviewMetrics.innerHTML = [
            metricCard("7 jours", `${num(summary.recent7?.distanceKm)} km`, `${num(summary.recent7?.durationHours)} h - D+ ${num(summary.recent7?.elevationM, 0)} m - ${summary.recent7?.activityCount || 0} activites`, "fa-fire"),
            metricCard("28 jours", `${num(summary.recent28?.distanceKm)} km`, `${num(summary.recent28?.durationHours)} h - D+ ${num(summary.recent28?.elevationM, 0)} m - ${summary.recent28?.activityCount || 0} activites`, "fa-calendar-days"),
            metricCard("Cumule", `${num(totals.distanceKm)} km`, `${num(totals.durationHours)} h au total - D+ ${num(totals.elevationM, 0)} m`, "fa-road"),
            metricCard("Recuperation", `${num(summary.recovery?.sleepHoursAvg)} h`, `BB reveil ${summary.recovery?.wakeBodyBatteryAvg ?? "--"} - ${num(summary.recovery?.stepsAvg, 0)} pas/j`, "fa-bed"),
        ].join("");
    }

    if (nodes.overviewSource) {
        nodes.overviewSource.innerHTML = `
            <p class="text-slate-400 text-sm uppercase tracking-[0.16em] mb-3">Source technique</p>
            <h3 class="font-display text-3xl text-white font-bold mb-5">Ce que le crawler remonte</h3>
            <div class="space-y-4">
                <div class="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
                    <p class="text-slate-500 text-sm mb-1">Exports retenus</p>
                    <p class="text-white font-semibold">Activites ${esc(exportDate(summary.source?.latestActivityExport))} - Sommeil ${esc(exportDate(summary.source?.latestSleepExport))}</p>
                </div>
                <div class="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
                    <p class="text-slate-500 text-sm mb-1">Volumes disponibles</p>
                    <p class="text-white font-semibold">${esc(`${summary.source?.activityCount || 0} activites, ${summary.source?.dailyCount || 0} jours bien-etre, ${summary.source?.sleepCount || 0} nuits sommeil`)}</p>
                </div>
                <div class="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
                    <p class="text-slate-500 text-sm mb-1">Derniere activite mesuree</p>
                    <p class="text-white font-semibold">${esc(date(summary.source?.latestActivityDate))}</p>
                </div>
            </div>
        `;
    }

    if (nodes.overviewHighlights) {
        nodes.overviewHighlights.innerHTML = `
            <p class="text-slate-400 text-sm uppercase tracking-[0.16em] mb-3">Lecture rapide</p>
            <h3 class="font-display text-3xl text-white font-bold mb-5">Points qui ressortent</h3>
            <div class="grid md:grid-cols-3 gap-4 mb-5">
                <div class="rounded-2xl border border-slate-800 bg-slate-950/45 p-5">
                    <p class="text-slate-500 text-sm mb-2">Dominante</p>
                    <p class="text-white font-semibold mb-2">${dominantSport ? esc(dominantSport.label) : "--"}</p>
                    <p class="text-slate-400 text-sm">${dominantSport ? `${esc(String(dominantSport.count))} seances - ${esc(`${num(dominantSport.distanceKm)} km`)}` : "Aucune dominante disponible"}</p>
                </div>
                <div class="rounded-2xl border border-slate-800 bg-slate-950/45 p-5">
                    <p class="text-slate-500 text-sm mb-2">Meilleure nuit recente</p>
                    <p class="text-white font-semibold mb-2">${bestNight?.score ?? "--"}/100</p>
                    <p class="text-slate-400 text-sm">${bestNight ? `${esc(date(bestNight.date))} - ${esc(sleepScoreLabels[bestNight.scoreLabel] || bestNight.scoreLabel || "Lecture")}` : "Aucune nuit exploitable"}</p>
                </div>
                <div class="rounded-2xl border border-slate-800 bg-slate-950/45 p-5">
                    <p class="text-slate-500 text-sm mb-2">Pic de charge</p>
                    <p class="text-white font-semibold mb-2">${peakLoad?.value ?? "--"}</p>
                    <p class="text-slate-400 text-sm">${peakLoad ? `${esc(date(peakLoad.date))} - ${esc(peakLoad.name)}` : "Charge max indisponible"}</p>
                </div>
            </div>
            <p class="text-slate-300 leading-relaxed">
                Le volume recent est fort et tres regulier. Le vrai point a surveiller est le sommeil, avec des nuits qui bougent beaucoup en score, en duree et en recharge.
            </p>
        `;
    }

    if (nodes.trainingRecords) {
        const records = [
            ["Record 1 km", summary.performance?.best1kSec ? clock(summary.performance.best1kSec) : "--", summary.performance?.best1kDate ? date(summary.performance.best1kDate) : "Date indisponible"],
            ["Record 5 km", summary.performance?.best5kSec ? clock(summary.performance.best5kSec) : "--", summary.performance?.best5kDate ? date(summary.performance.best5kDate) : "Date indisponible"],
            ["Record 10 km", summary.performance?.best10kSec ? clock(summary.performance.best10kSec) : "--", summary.performance?.best10kDate ? date(summary.performance.best10kDate) : "Date indisponible"],
            ["Plus longue course", summary.longestRun ? `${num(summary.longestRun.distanceKm)} km` : "--", summary.longestRun ? `${date(activityDate(summary.longestRun))} - ${pace(summary.longestRun.paceSecPerKm)}` : "Aucune sortie disponible"],
            ["Plus longue sortie velo", summary.longestRide ? `${num(summary.longestRide.distanceKm)} km` : "--", summary.longestRide ? `${date(activityDate(summary.longestRide))} - ${minutesLabel(summary.longestRide.durationMin)}` : "Aucune sortie disponible"],
            ["VO2 max / charge max", summary.performance?.vo2Max ? `${summary.performance.vo2Max}` : "--", peakLoad ? `Charge ${peakLoad.value} le ${date(peakLoad.date)}` : "Charge max indisponible"],
        ];

        nodes.trainingRecords.innerHTML = records
            .map(
                ([label, value, note]) => `
                    <article class="card rounded-3xl p-6">
                        <p class="text-slate-500 text-sm uppercase tracking-[0.14em] mb-3">${esc(label)}</p>
                        <p class="font-display text-4xl text-white font-bold mb-3">${esc(value)}</p>
                        <p class="text-slate-400 text-sm leading-relaxed">${esc(note)}</p>
                    </article>
                `
            )
            .join("");
    }

    if (nodes.trainingWeekly) {
        nodes.trainingWeekly.innerHTML = `
            <div class="flex items-start justify-between gap-4 flex-wrap mb-8">
                <div>
                    <p class="text-slate-400 text-sm uppercase tracking-[0.16em] mb-2">8 dernieres semaines</p>
                    <h3 class="font-display text-3xl text-white font-bold">Volume hebdomadaire</h3>
                </div>
                <p class="text-slate-500 text-sm">Distance en barre, puis duree et nombre de seances.</p>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4 items-end">
                ${weeklyVolume
                    .map((week) => {
                        const height = Math.max(16, Math.round(((week.distanceKm || 0) / weeklyMax) * 100));
                        return `
                            <div class="flex flex-col gap-3">
                                <div class="week-bar">
                                    <div class="week-bar-fill" style="height: ${height}%"></div>
                                </div>
                                <div class="rounded-2xl border border-slate-800 bg-slate-950/45 p-3">
                                    <p class="text-white font-semibold text-sm mb-1">${esc(week.weekKey)}</p>
                                    <p class="text-slate-400 text-xs">${esc(`${num(week.distanceKm)} km`)}</p>
                                    <p class="text-slate-500 text-xs">${esc(`${num(week.durationHours)} h - ${week.activityCount} seances`)}</p>
                                </div>
                            </div>
                        `;
                    })
                    .join("")}
            </div>
        `;
    }

    if (nodes.trainingBreakdown) {
        const maxBreakdown = Math.max(...breakdown.map((item) => item.distanceKm || 0), 1);
        nodes.trainingBreakdown.innerHTML = `
            <p class="text-slate-400 text-sm uppercase tracking-[0.16em] mb-2">Repartition</p>
            <h3 class="font-display text-3xl text-white font-bold mb-6">Par type d'activite</h3>
            <div class="space-y-5">
                ${breakdown
                    .map(
                        (item) => `
                            <div>
                                <div class="flex items-center justify-between gap-4 mb-2">
                                    <p class="text-white font-semibold">${esc(item.label)}</p>
                                    <p class="text-slate-400 text-sm">${esc(`${num(item.distanceKm)} km`)}</p>
                                </div>
                                <div class="progress-track mb-2">
                                    <div class="progress-fill" style="width: ${Math.max(6, ((item.distanceKm || 0) / maxBreakdown) * 100)}%"></div>
                                </div>
                                <p class="text-slate-500 text-xs">${esc(`${item.count} seances - ${num(item.durationHours)} h - D+ ${num(item.elevationM, 0)} m`)}</p>
                            </div>
                        `
                    )
                    .join("")}
            </div>
        `;
    }

    if (nodes.sleepMetrics) {
        nodes.sleepMetrics.innerHTML = [
            metricCard("Score moyen", `${summary.sleep?.scoreAvg ?? "--"}/100`, bestNight ? `Meilleure nuit ${bestNight.score}/100 le ${date(bestNight.date)}` : "Pas de score disponible", "fa-moon"),
            metricCard("Duree moyenne", `${num(summary.sleep?.durationAvg)} h`, worstNight ? `Nuit la plus faible ${worstNight.score}/100 le ${date(worstNight.date)}` : "Pas de point bas remonte", "fa-clock"),
            metricCard("HRV moyenne", `${summary.sleep?.hrvAvg ?? "--"}`, `Body Battery reveil ${summary.recovery?.wakeBodyBatteryAvg ?? "--"} en moyenne`, "fa-heart-pulse"),
            metricCard("Stress sommeil", `${summary.sleep?.stressAvg ?? "--"}`, `FC repos ${summary.recovery?.restingHeartRateAvg ?? "--"} bpm - ${recentIntensityMinutes} min d'intensite`, "fa-brain"),
        ].join("");
    }

    if (nodes.sleepNights) {
        nodes.sleepNights.innerHTML = recentNights.length
            ? recentNights
                  .map(
                      (night) => `
                        <article class="card rounded-3xl p-6">
                            <div class="flex items-start justify-between gap-4 mb-5">
                                <div>
                                    <p class="text-slate-500 text-sm mb-1">${esc(date(night.date))}</p>
                                    <h3 class="font-display text-2xl text-white font-bold">${esc(`${night.score ?? "--"}/100`)}</h3>
                                </div>
                                <span class="inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${tone(night.score)}">
                                    ${esc(sleepScoreLabels[night.scoreLabel] || night.scoreLabel || "Score")}
                                </span>
                            </div>
                            <div class="grid grid-cols-2 gap-3 mb-4">
                                <div class="rounded-2xl bg-slate-950/45 border border-slate-800 p-3">
                                    <p class="text-slate-500 text-xs mb-1">Sommeil</p>
                                    <p class="text-white font-semibold">${esc(`${num(night.durationHours)} h`)}</p>
                                </div>
                                <div class="rounded-2xl bg-slate-950/45 border border-slate-800 p-3">
                                    <p class="text-slate-500 text-xs mb-1">HRV</p>
                                    <p class="text-white font-semibold">${esc(String(night.overnightHrv ?? "--"))}</p>
                                </div>
                            </div>
                            <div class="space-y-2 text-sm text-slate-400">
                                <p>Profond ${esc(`${num(night.deepHours)} h`)} - Leger ${esc(`${num(night.lightHours)} h`)} - REM ${esc(`${num(night.remHours)} h`)}</p>
                                <p>Stress ${esc(String(night.avgSleepStress ?? "--"))} - FC ${esc(String(night.avgHeartRate ?? "--"))} bpm - SpO2 ${esc(String(night.avgSpO2 ?? "--"))}</p>
                                <p>Respiration ${esc(String(night.respirationAverage ?? "--"))} - Body Battery ${esc(String(night.bodyBatteryChange ?? "--"))}</p>
                                <p>HRV status ${esc(hrvStatusLabels[night.hrvStatus] || night.hrvStatus || "--")} - Sieste ${esc(String(night.napMinutes || 0))} min</p>
                            </div>
                        </article>
                    `
                  )
                  .join("")
            : panel("Aucune nuit recente disponible.");
    }

    if (nodes.wellnessHistory) {
        nodes.wellnessHistory.innerHTML = dailyHistory.length
            ? dailyHistory
                  .map(
                      (day) => `
                        <article class="card rounded-3xl p-6">
                            <div class="flex items-center justify-between gap-4 mb-5">
                                <div>
                                    <p class="text-slate-500 text-sm mb-1">Jour suivi</p>
                                    <h3 class="font-display text-2xl text-white font-bold">${esc(date(day.date))}</h3>
                                </div>
                                <span class="inline-flex px-3 py-1 rounded-full border border-slate-700 text-xs text-slate-300">${esc(`${num(day.steps, 0)} pas`)}</span>
                            </div>
                            <div class="grid sm:grid-cols-2 gap-3">
                                <div class="rounded-2xl bg-slate-950/45 border border-slate-800 p-4">
                                    <p class="text-slate-500 text-xs mb-1">Sommeil</p>
                                    <p class="text-white font-semibold">${esc(`${num(day.sleepHours)} h`)}</p>
                                    <p class="text-slate-500 text-xs mt-1">Body Battery reveil ${esc(String(day.wakeBodyBattery ?? "--"))}</p>
                                </div>
                                <div class="rounded-2xl bg-slate-950/45 border border-slate-800 p-4">
                                    <p class="text-slate-500 text-xs mb-1">Cardio et stress</p>
                                    <p class="text-white font-semibold">FC repos ${esc(String(day.restingHeartRate || "--"))} bpm</p>
                                    <p class="text-slate-500 text-xs mt-1">Stress ${esc(String(day.stress || "--"))}</p>
                                </div>
                                <div class="rounded-2xl bg-slate-950/45 border border-slate-800 p-4">
                                    <p class="text-slate-500 text-xs mb-1">Depense</p>
                                    <p class="text-white font-semibold">${esc(String(day.activeCalories || 0))} kcal actives</p>
                                    <p class="text-slate-500 text-xs mt-1">${esc(String(day.floorsAscended || 0))} etages - SpO2 ${esc(String(day.spo2 ?? "--"))}</p>
                                </div>
                                <div class="rounded-2xl bg-slate-950/45 border border-slate-800 p-4">
                                    <p class="text-slate-500 text-xs mb-1">Intensite</p>
                                    <p class="text-white font-semibold">${esc(String((day.moderateMinutes || 0) + (day.vigorousMinutes || 0)))} min</p>
                                    <p class="text-slate-500 text-xs mt-1">Modere ${esc(String(day.moderateMinutes || 0))} - Vigoureux ${esc(String(day.vigorousMinutes || 0))}</p>
                                </div>
                            </div>
                        </article>
                    `
                  )
                  .join("")
            : panel("Aucun historique journalier disponible.");
    }

    if (nodes.activitiesList) {
        nodes.activitiesList.innerHTML = recentActivities.length
            ? recentActivities
                  .map(
                      (activity) => `
                        <article class="card rounded-3xl p-6">
                            <div class="flex items-start justify-between gap-4 mb-5">
                                <div>
                                    <p class="text-slate-500 text-sm mb-1">${esc(date(activityDate(activity)))}</p>
                                    <h3 class="font-display text-2xl text-white font-bold leading-tight">${esc(activity.name)}</h3>
                                </div>
                                <span class="inline-flex px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-semibold uppercase tracking-[0.14em]">
                                    ${esc(typeLabels[activityType(activity)] || activityType(activity))}
                                </span>
                            </div>
                            <div class="grid sm:grid-cols-2 gap-3 mb-4">
                                <div class="rounded-2xl bg-slate-950/45 border border-slate-800 p-4">
                                    <p class="text-slate-500 text-xs mb-1">Volume</p>
                                    <p class="text-white font-semibold">${esc(`${num(activity.distanceKm)} km`)}</p>
                                    <p class="text-slate-500 text-xs mt-1">${esc(minutesLabel(activity.durationMin))} - ${esc(activityMetric(activity))}</p>
                                </div>
                                <div class="rounded-2xl bg-slate-950/45 border border-slate-800 p-4">
                                    <p class="text-slate-500 text-xs mb-1">Charge</p>
                                    <p class="text-white font-semibold">${esc(String(activity.trainingLoad || "--"))}</p>
                                    <p class="text-slate-500 text-xs mt-1">${esc(effect(activity.trainingEffect))}</p>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div class="rounded-2xl bg-slate-950/40 border border-slate-800 p-3">
                                    <p class="text-slate-500 text-xs mb-1">Cardio</p>
                                    <p class="text-white font-semibold">${esc(String(activity.averageHr || "--"))} / ${esc(String(activity.maxHr || "--"))}</p>
                                </div>
                                <div class="rounded-2xl bg-slate-950/40 border border-slate-800 p-3">
                                    <p class="text-slate-500 text-xs mb-1">Puissance</p>
                                    <p class="text-white font-semibold">${esc(String(activity.avgPower || 0))} / ${esc(String(activity.maxPower || 0))}</p>
                                </div>
                                <div class="rounded-2xl bg-slate-950/40 border border-slate-800 p-3">
                                    <p class="text-slate-500 text-xs mb-1">Energie</p>
                                    <p class="text-white font-semibold">${esc(String(activity.calories || 0))} kcal</p>
                                </div>
                                <div class="rounded-2xl bg-slate-950/40 border border-slate-800 p-3">
                                    <p class="text-slate-500 text-xs mb-1">Terrain</p>
                                    <p class="text-white font-semibold">D+ ${esc(String(activity.elevationM || 0))} m</p>
                                </div>
                            </div>
                            <div class="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
                                <span class="px-3 py-1.5 rounded-full bg-slate-950/50 border border-slate-800">${esc(`${activity.steps || 0} pas`)}</span>
                                ${activity.vo2Max ? `<span class="px-3 py-1.5 rounded-full bg-slate-950/50 border border-slate-800">VO2 ${esc(String(activity.vo2Max))}</span>` : ""}
                                ${activity.fastestSplit1kSec ? `<span class="px-3 py-1.5 rounded-full bg-slate-950/50 border border-slate-800">1 km ${esc(clock(activity.fastestSplit1kSec))}</span>` : ""}
                                ${activity.fastestSplit5kSec ? `<span class="px-3 py-1.5 rounded-full bg-slate-950/50 border border-slate-800">5 km ${esc(clock(activity.fastestSplit5kSec))}</span>` : ""}
                                ${activity.fastestSplit10kSec ? `<span class="px-3 py-1.5 rounded-full bg-slate-950/50 border border-slate-800">10 km ${esc(clock(activity.fastestSplit10kSec))}</span>` : ""}
                            </div>
                        </article>
                    `
                  )
                  .join("")
            : panel("Aucune activite recente disponible.");
    }
});
