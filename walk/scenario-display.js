/** Plain-English scenario copy for walk UI (overlays catalog.json). */
(function (global) {
  const WHO_LABELS = {
    Mac: "Setup",
    Console: "Setup",
    Check: "Verify",
    Field: "Walk",
    Phone: "Phone",
    Optional: "Optional",
  };

  let humanCopyCache = null;

  async function loadHumanCopy() {
    if (humanCopyCache) return humanCopyCache;
    try {
      const res = await fetch("../scenarios/scenario-human-copy.json");
      if (!res.ok) return {};
      const data = await res.json();
      humanCopyCache = data.scenarios || {};
    } catch (_) {
      humanCopyCache = {};
    }
    return humanCopyCache;
  }

  function normalizePlaybookWho(playbook) {
    return (playbook || []).map((step) => ({
      ...step,
      who: WHO_LABELS[step.who] || step.who || "Step",
    }));
  }

  function applyHumanCopy(scenario, copyMap) {
    if (!scenario) return scenario;
    const overlay = (copyMap || {})[scenario.id] || {};
    const merged = { ...scenario };
    for (const key of ["purpose", "summary", "passCriteria", "playbook", "cleanupWhen"]) {
      if (overlay[key] !== undefined) merged[key] = overlay[key];
    }
    if (merged.playbook) merged.playbook = normalizePlaybookWho(merged.playbook);
    else if (scenario.playbook) merged.playbook = normalizePlaybookWho(scenario.playbook);
    merged.passCriteria = merged.passCriteria || merged.fieldLogExpect || [];
    merged.fieldLogExpect = merged.passCriteria;
    return merged;
  }

  async function scenarioForDisplay(scenario) {
    const copy = await loadHumanCopy();
    return applyHumanCopy(scenario, copy);
  }

  global.ScenarioDisplay = {
    loadHumanCopy,
    applyHumanCopy,
    scenarioForDisplay,
    normalizePlaybookWho,
  };
})(typeof window !== "undefined" ? window : globalThis);
