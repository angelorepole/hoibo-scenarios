/** Plain-English copy from each scenario's pack `display` block. */
(function (global) {
  const WHO_LABELS = {
    Mac: "Setup",
    Console: "Setup",
    Check: "Verify",
    Field: "Walk",
    Phone: "Phone",
    "Phone (user)": "Phone",
    "Phone (merchant)": "Merchant",
    Merchant: "Merchant",
    Optional: "Optional",
    Setup: "Setup",
    Walk: "Walk",
    Verify: "Verify",
  };

  const SECTION_LABELS = {
    setup: "Set up",
    test_run: "Test run",
    log_validation: "Log validation",
  };

  const SECTION_ORDER = ["setup", "test_run", "log_validation"];

  const SCENARIO_OFFER_START_OFFSET_MINUTES = 15;

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatMoney(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return "";
    return n % 1 === 0 ? `£${n}` : `£${n.toFixed(2)}`;
  }

  function formatOfferDeal(offer) {
    const orig = Number(offer.original_price);
    const disc = Number(offer.discount_amount);
    if (!Number.isFinite(orig) || !Number.isFinite(disc) || disc <= 0) return "";
    const pay = Math.max(0, orig - disc);
    return `${formatMoney(disc)} off · pay ${formatMoney(pay)}`;
  }

  function offerWindow(offer, seedIso) {
    if (offer.starts_at && offer.expires_at) {
      return {
        starts: new Date(offer.starts_at),
        expires: new Date(offer.expires_at),
      };
    }
    const anchor = seedIso ? new Date(seedIso) : new Date();
    const durationMin = Number(offer.duration_minutes) || 240;
    const starts = new Date(
      anchor.getTime() - SCENARIO_OFFER_START_OFFSET_MINUTES * 60_000,
    );
    const expires = new Date(anchor.getTime() + durationMin * 60_000);
    return { starts, expires };
  }

  function formatDurationLeft(minutes) {
    if (minutes >= 120) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m ? `${h}h ${m}m left` : `${h}h left`;
    }
    return `${minutes}m left`;
  }

  function offerExpiryLine(offer, seedIso, now = new Date()) {
    const { expires } = offerWindow(offer, seedIso);
    const msLeft = expires.getTime() - now.getTime();
    const timeStr = expires.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (msLeft <= 0) {
      return {
        text: `Expired at ${timeStr} — pull feed (auto-refresh ~3 min)`,
        tone: "expired",
      };
    }
    const minsLeft = Math.ceil(msLeft / 60_000);
    const durationMin = Number(offer.duration_minutes) || 240;
    return {
      text: `Expires ${timeStr} (${formatDurationLeft(minsLeft)}) · ${durationMin} min window`,
      tone: minsLeft <= 30 ? "soon" : "live",
    };
  }

  function formatShopPopupHtml(shop, shopIndex, options) {
    const opts = options || {};
    const redeemExpected = !!opts.redeemExpected;
    const run = opts.run || {};
    const seedIso = run.seeded_at || run.started_at || null;
    const title = shop.display_name || shop.trading_name || "Shop";
    const category = shop.category || "";

    let offersHtml = "";
    (shop.offers || []).forEach((offer, offerIndex) => {
      const expiry = offerExpiryLine(offer, seedIso);
      const deal = formatOfferDeal(offer);
      const redeemBtn = redeemExpected
        ? `<button type="button" class="btn btn-primary" onclick="redeemShop(${shopIndex}, ${offerIndex}, this)">Redeem (real API)</button>`
        : "";
      offersHtml += `
        <div class="popup-offer">
          <div class="popup-offer-head">
            <span class="popup-offer-title">${escapeHtml(offer.title || "Offer")}</span>
            ${deal ? `<span class="popup-offer-deal">${escapeHtml(deal)}</span>` : ""}
          </div>
          <p class="popup-offer-expiry expiry-${expiry.tone}">${escapeHtml(expiry.text)}</p>
          ${redeemBtn}
        </div>
      `;
    });

    const foot = redeemExpected
      ? ""
      : `<p class="popup-foot hint">View only — no redeem in this scenario.</p>`;

    return `
      <div class="shop-popup">
        <h3>${escapeHtml(title)}</h3>
        ${category ? `<p class="shop-popup-meta">${escapeHtml(category)}</p>` : ""}
        <div class="popup-offers">${offersHtml}</div>
        ${foot}
      </div>
    `;
  }

  function stepAudience(who) {
    const label = String(who || "").trim();
    if (label === "Setup" || label === "Console" || label === "Mac") return "setup";
    if (label === "Walk" || label === "Field") return "walk";
    if (label === "Verify" || label === "Check") return "verify";
    if (label.toLowerCase().startsWith("optional")) return "optional";
    if (label.toLowerCase().includes("merchant")) return "merchant";
    return "phone";
  }

  function stepSection(step) {
    const section = String(step?.section || "").trim();
    if (SECTION_LABELS[section]) return section;
    const who = stepAudience(step?.who);
    if (who === "setup") return "setup";
    if (who === "verify") return "log_validation";
    if (who === "walk" || who === "phone" || who === "merchant" || who === "optional") {
      return "test_run";
    }
    return "test_run";
  }

  function groupPlaybookBySection(playbook) {
    const groups = new Map();
    for (const id of SECTION_ORDER) groups.set(id, []);
    for (const step of playbook || []) {
      const section = stepSection(step);
      if (!groups.has(section)) groups.set(section, []);
      groups.get(section).push(step);
    }
    return SECTION_ORDER.filter((id) => groups.get(id).length).map((id) => ({
      id,
      label: SECTION_LABELS[id] || id,
      steps: groups.get(id),
    }));
  }

  /** True only when the Walk step tells the tester to redeem (e.g. WALK-04 days 1–3). */
  function playbookExpectsRedeem(playbook) {
    const walk = (playbook || []).find((step) => {
      const who = String(step?.who || "");
      return who === "Walk" || who === "Field";
    });
    if (!walk) return false;
    return String(walk.do || "").toLowerCase().includes("redeem");
  }

  function normalizePlaybookWho(playbook) {
    return (playbook || []).map((step) => ({
      ...step,
      who: WHO_LABELS[step.who] || step.who || "Step",
    }));
  }

  function filterPlaybookForHosted(playbook, runActive) {
    if (!runActive) return playbook || [];
    return (playbook || []).filter((step) => stepSection(step) !== "setup");
  }

  function applyHumanCopy(scenario) {
    if (!scenario) return scenario;
    const overlay = scenario.display || {};
    const merged = { ...scenario };
    for (const key of ["purpose", "summary", "passCriteria", "cleanupWhen"]) {
      if (overlay[key] !== undefined) merged[key] = overlay[key];
    }
    if (merged.playbook) merged.playbook = normalizePlaybookWho(merged.playbook);
    else if (scenario.playbook) merged.playbook = normalizePlaybookWho(scenario.playbook);
    merged.passCriteria = merged.passCriteria || merged.fieldLogExpect || [];
    merged.fieldLogExpect = merged.passCriteria;
    return merged;
  }

  function scenarioForDisplay(scenario) {
    return applyHumanCopy(scenario);
  }

  function formatPlaybookStepHtml(doText) {
    const raw = String(doText || "").trim();
    if (!raw) return "";
    if (!raw.includes("\n")) return escapeHtml(raw);
    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length <= 1) return escapeHtml(raw);
    return `<ul class="step-do-list">${lines
      .map((line) => `<li>${escapeHtml(line)}</li>`)
      .join("")}</ul>`;
  }

  global.ScenarioDisplay = {
    applyHumanCopy,
    scenarioForDisplay,
    normalizePlaybookWho,
    stepAudience,
    stepSection,
    groupPlaybookBySection,
    playbookExpectsRedeem,
    formatPlaybookStepHtml,
    SECTION_LABELS,
    filterPlaybookForHosted,
    formatOfferDeal,
    offerExpiryLine,
    formatShopPopupHtml,
    SCENARIO_OFFER_START_OFFSET_MINUTES,
  };
})(typeof window !== "undefined" ? window : globalThis);
