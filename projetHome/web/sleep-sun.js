(function () {
  const elements = {
    bedtimeNote: document.getElementById("bedtimeNote"),
    bedtimeValue: document.getElementById("bedtimeValue"),
    generatedAt: document.getElementById("sleepSunGeneratedAt"),
    automation: document.getElementById("sleepSunAutomation"),
    comparison: document.getElementById("sleepSunComparison"),
    refreshButton: document.getElementById("sleepSunRefreshButton"),
    status: document.getElementById("sleepSunStatus"),
    sunriseDate: document.getElementById("sunriseDateValue"),
    sunriseValue: document.getElementById("sunriseTimeValue"),
    temperature: document.getElementById("sleepSunTemperature"),
    wakeNote: document.getElementById("wakeTimeNote"),
    wakeValue: document.getElementById("wakeTimeValue"),
  };

  const state = {
    isLoading: false,
    refreshTimer: null,
  };

  const esc = (value) =>
    String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const formatDate = (value) => {
    if (!value) {
      return "--";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "--";
    }

    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const statCard = (label, value, note) => `
    <article class="sleep-sun-mini-card">
      <p class="sleep-sun-mini-label">${esc(label)}</p>
      <p class="sleep-sun-mini-value">${esc(value)}</p>
      <p class="sleep-sun-mini-note">${esc(note)}</p>
    </article>
  `;

  const renderSnapshot = (snapshot) => {
    elements.sunriseValue.textContent = snapshot.sunrise?.label || "--:--";
    elements.sunriseDate.textContent = `${snapshot.location?.name || "Bordeaux"} - ${snapshot.date || "--"}`;
    elements.wakeValue.textContent = snapshot.wake?.averageLabel || "--:--";
    elements.wakeNote.textContent = snapshot.wake?.note || "Pas assez de donnees pour calculer ton reveil moyen.";
    elements.bedtimeValue.textContent = snapshot.bedtimeForSunrise?.label || "--:--";
    elements.bedtimeNote.textContent = snapshot.bedtimeForSunrise?.note || "Calcul indisponible.";
    elements.generatedAt.textContent = `Mise a jour ${formatDate(snapshot.generatedAt)}`;

    elements.comparison.innerHTML = [
      statCard(
        "Dernier reveil",
        snapshot.wake?.latestLabel || "--:--",
        snapshot.wake?.latestDate ? `Nuit du ${snapshot.wake.latestDate}` : "Aucune nuit recente"
      ),
      statCard(
        "Besoin moyen",
        snapshot.sleepNeed?.label || "--",
        "Base Garmin pour viser le soleil"
      ),
      statCard(
        "Score sommeil",
        snapshot.sleep?.scoreAvg != null ? `${snapshot.sleep.scoreAvg}/100` : "--",
        snapshot.sleep?.durationAvgHours != null ? `${snapshot.sleep.durationAvgHours} h de moyenne` : "Duree indisponible"
      ),
      statCard(
        "Dette sommeil",
        snapshot.sleep?.sleepDebtHours != null ? `${snapshot.sleep.sleepDebtHours} h` : "--",
        `${snapshot.sleep?.recentNightCount || 0} nuits recentes prises en compte`
      ),
    ].join("");

    elements.automation.innerHTML = `
      <p class="sleep-sun-callout-title">Volet au lever du soleil</p>
      <p class="sleep-sun-callout-text">${esc(snapshot.automation?.shutters?.message || "A venir.")}</p>
      <p class="sleep-sun-callout-meta">Cible actuelle: ${esc(snapshot.automation?.shutters?.targetSunriseLabel || "--:--")}</p>
    `;

    elements.temperature.innerHTML = `
      <p class="sleep-sun-callout-title">Temperature de chambre</p>
      <p class="sleep-sun-callout-text">${esc(snapshot.environment?.temperature?.message || "A venir.")}</p>
      <p class="sleep-sun-callout-meta">Le but sera d alerter si la temperature de sommeil devient trop elevee.</p>
    `;

    elements.status.innerHTML = `
      <article class="sleep-sun-status-card ok">
        <p class="sleep-sun-callout-title">Page prete</p>
        <p class="sleep-sun-callout-text">Le calcul soleil + sommeil est disponible localement depuis le hub.</p>
      </article>
    `;
  };

  const renderError = (message) => {
    elements.status.innerHTML = `
      <article class="sleep-sun-status-card warn">
        <p class="sleep-sun-callout-title">Erreur</p>
        <p class="sleep-sun-callout-text">${esc(message || "Impossible de charger la page sommeil soleil.")}</p>
      </article>
    `;
  };

  const loadSnapshot = async () => {
    if (state.isLoading) {
      return;
    }

    state.isLoading = true;
    elements.refreshButton.disabled = true;
    elements.refreshButton.textContent = "Chargement...";

    try {
      const response = await fetch("/api/sleep-sun", {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const snapshot = await response.json();
      renderSnapshot(snapshot);
    } catch (error) {
      renderError(error.message || "Impossible de charger la page sommeil soleil.");
    } finally {
      state.isLoading = false;
      elements.refreshButton.disabled = false;
      elements.refreshButton.textContent = "Actualiser";
      window.clearTimeout(state.refreshTimer);
      state.refreshTimer = window.setTimeout(loadSnapshot, 300000);
    }
  };

  elements.refreshButton.addEventListener("click", () => {
    loadSnapshot();
  });

  loadSnapshot();
})();
