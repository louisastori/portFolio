gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.getElementById("navbar");
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const mobileMenu = document.getElementById("mobile-menu");
    const mobileLinks = document.querySelectorAll(".mobile-link");
    const projectContainer = document.getElementById("github-projects");
    const loader = document.getElementById("projects-loader");
    const sportGeneratedAt = document.getElementById("sport-generated-at");
    const sportMetrics = document.getElementById("sport-metrics");
    const sportHighlight = document.getElementById("sport-highlight");
    const sportRecentActivities = document.getElementById("sport-recent-activities");

    const typeLabels = {
        running: "Course",
        treadmill_running: "Tapis",
        trail_running: "Trail",
        cycling: "Cyclisme",
        road_biking: "Route",
        virtual_ride: "Home trainer",
    };

    mobileMenuBtn?.addEventListener("click", () => {
        mobileMenu?.classList.toggle("hidden");
    });

    mobileLinks.forEach((link) => {
        link.addEventListener("click", () => mobileMenu?.classList.add("hidden"));
    });

    window.addEventListener("scroll", () => {
        if (!navbar) return;
        if (window.scrollY > 40) {
            navbar.classList.add("shadow-2xl");
            navbar.style.borderBottom = "1px solid rgba(148, 163, 184, 0.12)";
        } else {
            navbar.classList.remove("shadow-2xl");
            navbar.style.borderBottom = "1px solid transparent";
        }
    });

    gsap.fromTo(
        ".hero-elem",
        { y: 32, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.14, ease: "power3.out", delay: 0.2 }
    );

    document.querySelectorAll(".gsap-reveal").forEach((element) => {
        gsap.fromTo(
            element,
            { autoAlpha: 0, y: 42 },
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: element,
                    start: "top 86%",
                },
            }
        );
    });

    const escapeHtml = (value = "") =>
        String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    const formatNumber = (value, digits = 1) =>
        Number(value || 0).toLocaleString("fr-FR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: digits,
        });

    const formatDate = (isoDate) => {
        if (!isoDate) return "--";
        return new Date(`${isoDate}T12:00:00`).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const formatDurationMinutes = (minutes) => {
        const safeMinutes = Math.round(minutes || 0);
        const hours = Math.floor(safeMinutes / 60);
        const remainingMinutes = safeMinutes % 60;
        if (!hours) return `${remainingMinutes} min`;
        return `${hours} h ${String(remainingMinutes).padStart(2, "0")}`;
    };

    const formatClock = (seconds) => {
        if (seconds == null) return "--";
        const total = Math.round(seconds);
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const remainingSeconds = total % 60;
        if (hours) {
            return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
        }
        return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
    };

    const formatPace = (secondsPerKm) => (secondsPerKm ? `${formatClock(secondsPerKm)} /km` : "--");

    const formatTrainingEffect = (value) =>
        value
            ? value
                  .toLowerCase()
                  .split("_")
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" ")
            : "Seance";

    const getActivityDate = (activity) => activity?.dateLocal || activity?.date || null;
    const getActivityType = (activity) => activity?.typeKey || activity?.type || "activity";

    const renderSportSummary = (summary) => {
        if (!sportMetrics || !sportHighlight || !sportRecentActivities || !sportGeneratedAt) return;

        const recent28 = summary?.recent28 || {};
        const performance = summary?.performance || {};
        const recovery = summary?.recovery || {};
        const syncDate = summary?.source?.latestSleepExport?.slice(0, 10)
            || summary?.source?.latestDailyExport?.slice(0, 10)
            || summary?.source?.latestActivityDate;

        sportGeneratedAt.textContent = `Derniere synchro Garmin : ${formatDate(syncDate)}. Analyse arretee au ${formatDate(summary?.source?.latestActivityDate)}.`;

        const metricCards = [
            {
                label: "Volume 28 jours",
                value: `${formatNumber(recent28.distanceKm)} km`,
                note: `${formatNumber(recent28.durationHours)} h d'effort - D+ ${formatNumber(recent28.elevationM, 0)} m - ${recent28.activityCount || 0} seances`,
                icon: "fa-person-running",
            },
            {
                label: "VO2 max",
                value: performance.vo2Max ?? "--",
                note: `FC repos moyenne ${recovery.restingHeartRateAvg ?? "--"} bpm`,
                icon: "fa-heart-pulse",
            },
            {
                label: "Record 5 km",
                value: performance.best5kSec ? formatClock(performance.best5kSec) : "--",
                note: performance.best5kDate ? `Meilleure marque relevee le ${formatDate(performance.best5kDate)}` : "Aucune marque disponible",
                icon: "fa-stopwatch",
            },
            {
                label: "Recuperation",
                value: `${formatNumber(recovery.sleepHoursAvg)} h`,
                note: `Body Battery reveil ${recovery.wakeBodyBatteryAvg ?? "--"} - ${(recovery.stepsAvg || 0).toLocaleString("fr-FR")} pas/j`,
                icon: "fa-bed",
            },
        ];

        sportMetrics.innerHTML = metricCards
            .map(
                (card) => `
                    <article class="card rounded-3xl p-6">
                        <div class="flex items-center justify-between gap-4 mb-5">
                            <p class="text-slate-400 text-sm uppercase tracking-[0.14em]">${escapeHtml(card.label)}</p>
                            <span class="w-11 h-11 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                                <i class="fas ${escapeHtml(card.icon)}"></i>
                            </span>
                        </div>
                        <p class="font-display text-4xl text-white font-bold mb-3">${escapeHtml(card.value)}</p>
                        <p class="text-slate-400 text-sm leading-relaxed">${escapeHtml(card.note)}</p>
                    </article>
                `
            )
            .join("");

        const longestRun = summary?.longestRun;
        const longestRide = summary?.longestRide;
        const peakLoad = performance.highestTrainingLoad;

        sportHighlight.innerHTML = `
            <p class="text-slate-400 text-sm uppercase tracking-[0.16em] mb-3">Garmin + crawler maison</p>
            <h3 class="font-display text-3xl text-white font-bold mb-4">Le sport aussi fait partie de mon profil</h3>
            <p class="text-slate-300 leading-relaxed mb-6">
                Je suis mes progres avec mes donnees Garmin. Ca me sert a mesurer la charge, la recuperation et la regularite,
                avec la meme logique de suivi que dans mes projets techniques. Le detail complet est disponible dans l'onglet Sport+.
            </p>
            <div class="grid sm:grid-cols-2 gap-4">
                <div class="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                    <p class="text-slate-500 text-sm mb-2">Sortie longue course</p>
                    <p class="font-display text-3xl text-white font-bold mb-2">${longestRun ? escapeHtml(`${formatNumber(longestRun.distanceKm)} km`) : "--"}</p>
                    <p class="text-slate-300 text-sm">${longestRun ? `${escapeHtml(formatDate(getActivityDate(longestRun)))} - ${escapeHtml(formatDurationMinutes(longestRun.durationMin))} - ${escapeHtml(formatPace(longestRun.paceSecPerKm))}` : "Aucune sortie longue disponible"}</p>
                    <p class="text-slate-500 text-sm mt-2">${longestRun ? `FC moy. ${escapeHtml(String(longestRun.averageHr))} bpm - ${escapeHtml(formatTrainingEffect(longestRun.trainingEffect))}` : "Donnees manquantes"}</p>
                </div>
                <div class="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                    <p class="text-slate-500 text-sm mb-2">Pic de charge</p>
                    <p class="font-display text-3xl text-white font-bold mb-2">${peakLoad ? escapeHtml(String(peakLoad.value)) : "--"}</p>
                    <p class="text-slate-300 text-sm">${peakLoad?.date ? `${escapeHtml(formatDate(peakLoad.date))} - ${escapeHtml(peakLoad.name)}` : "Charge max indisponible"}</p>
                    <p class="text-slate-500 text-sm mt-2">${longestRide ? `Longue sortie velo ${escapeHtml(`${formatNumber(longestRide.distanceKm)} km`)}` : `Sommeil moyen ${escapeHtml(formatNumber(recovery.sleepHoursAvg))} h - stress moyen ${escapeHtml(String(recovery.stressAvg ?? "--"))}`}</p>
                </div>
            </div>
        `;

        const recentActivities = (summary?.recentActivities || []).slice(0, 4);
        sportRecentActivities.innerHTML = recentActivities.length
            ? recentActivities
                  .map(
                      (activity) => `
                        <article class="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                            <div class="flex items-center justify-between gap-3 mb-4">
                                <span class="text-xs uppercase tracking-[0.14em] text-accent">${escapeHtml(typeLabels[getActivityType(activity)] || getActivityType(activity))}</span>
                                <span class="text-xs text-slate-500">${escapeHtml(formatDate(getActivityDate(activity)))}</span>
                            </div>
                            <h4 class="text-white font-semibold mb-3 leading-snug">${escapeHtml(activity.name)}</h4>
                            <div class="space-y-2 text-sm text-slate-400">
                                <p>${escapeHtml(`${formatNumber(activity.distanceKm)} km`)} - ${escapeHtml(formatDurationMinutes(activity.durationMin))}</p>
                                <p>FC moy. ${escapeHtml(String(activity.averageHr || "--"))} bpm - D+ ${escapeHtml(String(activity.elevationM || 0))} m</p>
                                <p>${escapeHtml(formatTrainingEffect(activity.trainingEffect))} - charge ${escapeHtml(String(activity.trainingLoad || "--"))}</p>
                            </div>
                        </article>
                    `
                  )
                  .join("")
            : `
                <article class="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                    <p class="text-slate-400 text-sm">Aucune seance recente disponible.</p>
                </article>
            `;
    };

    const showSportFallback = () => {
        if (sportGeneratedAt) {
            sportGeneratedAt.textContent = "Les donnees sportives Garmin ne sont pas disponibles pour le moment.";
        }
        if (sportMetrics) {
            sportMetrics.innerHTML = `
                <article class="card rounded-3xl p-6">
                    <p class="text-slate-300">Impossible de charger le resume Garmin.</p>
                </article>
            `;
        }
        if (sportHighlight) {
            sportHighlight.innerHTML = `<p class="text-slate-300">Le crawler Garmin est present dans le projet, mais aucun resume exploitable n'a pu etre charge.</p>`;
        }
        if (sportRecentActivities) {
            sportRecentActivities.innerHTML = `
                <article class="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                    <p class="text-slate-400 text-sm">Aucune seance recente disponible.</p>
                </article>
            `;
        }
    };

    const renderSportFromGlobal = () => {
        if (window.__GARMIN_SUMMARY__) {
            renderSportSummary(window.__GARMIN_SUMMARY__);
            return true;
        }
        return false;
    };

    function createProjectCard(repo) {
        const card = document.createElement("article");
        const description = repo.description
            ? repo.description.slice(0, 120)
            : "Aucune description renseignee pour ce projet.";
        const liveLink = repo.homepage
            ? `<a href="${repo.homepage}" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-accent transition-colors" aria-label="Lien externe"><i class="fas fa-arrow-up-right-from-square"></i></a>`
            : "";

        card.className = "card rounded-3xl p-6 flex flex-col";
        card.innerHTML = `
            <div class="flex items-start justify-between mb-5">
                <div class="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center text-xl">
                    <i class="far fa-folder-open"></i>
                </div>
                <div class="flex items-center gap-3 text-lg">
                    <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-accent transition-colors" aria-label="Lien GitHub"><i class="fab fa-github"></i></a>
                    ${liveLink}
                </div>
            </div>
            <h3 class="font-display text-2xl text-white font-bold mb-3">${repo.name}</h3>
            <p class="text-slate-400 text-sm leading-relaxed mb-6 flex-grow">${description}</p>
            <div class="pt-4 border-t border-slate-800 flex flex-wrap gap-3 text-xs text-slate-400">
                ${repo.language ? `<span class="text-accent">${repo.language}</span>` : ""}
                <span><i class="far fa-star mr-1"></i>${repo.stargazers_count}</span>
                <span><i class="fas fa-code-branch mr-1"></i>${repo.forks_count}</span>
            </div>
        `;
        return card;
    }

    function showFallbackProjects() {
        if (!projectContainer) return;

        const fallback = [
            {
                name: "Portfolio Louis Astori",
                description: "Portfolio personnel avec competences, experiences, performances sportives Garmin et projets GitHub.",
                language: "HTML / JS",
                html_url: "#",
                stargazers_count: 0,
                forks_count: 0,
            },
            {
                name: "France Travail",
                description: "Travail sur la recherche d'offres avec Angular et Tapestry dans un contexte produit.",
                language: "Angular",
                html_url: "#",
                stargazers_count: 0,
                forks_count: 0,
            },
            {
                name: "Authentification",
                description: "Interventions Angular, Java et batch sur des sujets d'authentification.",
                language: "Java",
                html_url: "#",
                stargazers_count: 0,
                forks_count: 0,
            },
        ];

        projectContainer.innerHTML = "";
        fallback.forEach((repo) => projectContainer.appendChild(createProjectCard(repo)));
    }

    async function fetchProjects() {
        if (!projectContainer) return;

        try {
            const response = await fetch("https://api.github.com/users/louisastori/repos?sort=updated&per_page=6");
            if (!response.ok) throw new Error(`GitHub API ${response.status}`);
            const repos = await response.json();
            loader?.remove();
            projectContainer.innerHTML = "";
            if (!Array.isArray(repos) || repos.length === 0) {
                showFallbackProjects();
                return;
            }
            repos.slice(0, 6).forEach((repo) => projectContainer.appendChild(createProjectCard(repo)));
        } catch (error) {
            console.error("Impossible de charger les projets GitHub", error);
            loader?.remove();
            showFallbackProjects();
        }
    }

    if (!renderSportFromGlobal()) {
        showSportFallback();
    }

    fetchProjects();
});
