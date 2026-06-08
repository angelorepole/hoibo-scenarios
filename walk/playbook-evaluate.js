/** Playbook step auto-checks — browser (mirrors playbook_checker.py). */
(function (global) {
  const NEAR_SHOP_M = 250;
  const DWELL_SECONDS = 180;
  const WALK_ACTIVITIES = new Set(["walking", "stationary", "unknown"]);

  function distanceMetres(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function parseAt(value) {
    if (!value) return null;
    const d = new Date(String(value).replace("Z", "+00:00"));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function shopsFromRun(runMeta) {
    return runMeta?.shops || [];
  }

  function nearestShopM(entry, shops) {
    const lat = entry.lat;
    const lng = entry.lng;
    if (lat == null || lng == null || !shops.length) return null;
    return Math.min(
      ...shops.map((s) => distanceMetres(Number(lat), Number(lng), Number(s.lat), Number(s.lng))),
    );
  }

  function entriesNearShops(entries, shops, maxM) {
    return entries.filter((entry) => {
      const dist = nearestShopM(entry, shops);
      return dist != null && dist <= maxM;
    });
  }

  function checkFieldNearShopDwell(entries, shops) {
    const near = entriesNearShops(entries, shops, NEAR_SHOP_M);
    if (!near.length) {
      return {
        pass: false,
        detail: `Log does not show you near a shop — stand within ${NEAR_SHOP_M} m of a pin for ${Math.floor(DWELL_SECONDS / 60)}+ minutes, then upload log again`,
      };
    }
    const walking = near.filter((e) => WALK_ACTIVITIES.has(e.activity || "unknown"));
    if (!walking.length) {
      return { pass: false, detail: "Log shows driving or wrong movement — walk or stand still near the pin" };
    }
    const times = walking.map((e) => parseAt(e.at)).filter(Boolean);
    if (times.length >= 2) {
      const span = Math.abs((Math.max(...times.map(Number)) - Math.min(...times.map(Number))) / 1000);
      if (span >= DWELL_SECONDS) {
        return { pass: true, detail: "" };
      }
    }
    return {
      pass: false,
      detail: `Stay near the pin longer (${Math.floor(DWELL_SECONDS / 60)}+ minutes, app open), then upload log again`,
    };
  }

  function checkFieldOffersSeen(entries, shops) {
    const near = entriesNearShops(entries, shops, NEAR_SHOP_M);
    const withOffers = near.filter((e) => Number(e.offerCount || 0) > 0);
    if (withOffers.length) {
      return { pass: true, detail: "" };
    }
    return { pass: false, detail: "Pull the feed while near a shop, then upload log again" };
  }

  function evaluatePlaybook(scenario, { runMeta, log, runActive, fieldLogOk } = {}) {
    const playbook = scenario.playbook || [];
    let entries = [];
    if (log != null && global.ScenarioFieldLog) {
      try {
        entries = global.ScenarioFieldLog.parseFieldLog(log);
      } catch (_) {
        entries = [];
      }
    }

    const shops = shopsFromRun(runMeta);
    let analysisOk = fieldLogOk;
    if (analysisOk == null && entries.length && global.ScenarioFieldLog) {
      analysisOk = global.ScenarioFieldLog.analyzeFieldLog(scenario, entries, runMeta).ok;
    }

    return playbook.map((step) => {
      const verify = step.verify || "manual";
      const row = {
        step: step.step,
        who: step.who || "",
        do: step.do || "",
        verify,
        status: "manual",
        detail: "",
      };

      if (verify === "manual") return row;

      if (verify === "run_seeded") {
        const ok = Boolean(runMeta && shops.length);
        row.status = ok ? "pass" : "pending";
        row.detail = ok ? "" : "Tap Run scenario";
        return row;
      }

      if (verify === "run_removed") {
        const ok = runActive === false;
        row.status = ok ? "pass" : "pending";
        row.detail = ok ? "" : "Tap Finish & remove";
        return row;
      }

      if (verify === "log_pasted") {
        const ok = entries.length > 0;
        row.status = ok ? "pass" : "pending";
        row.detail = ok ? "" : "Add Phone Log (top right)";
        return row;
      }

      if (verify === "field_log_rules") {
        if (!entries.length) {
          row.status = "pending";
          row.detail = "";
        } else if (analysisOk === true) {
          row.status = "pass";
          row.detail = "";
        } else if (analysisOk === false) {
          row.status = "fail";
          row.detail = "Log check failed — read results above";
        } else {
          row.status = "pending";
          row.detail = "Tap Check log";
        }
        return row;
      }

      if (!shops.length) {
        row.status = "pending";
        row.detail = "Tap Run scenario first";
        return row;
      }

      if (!entries.length) {
        row.status = "pending";
        row.detail = "";
        return row;
      }

      let chk;
      if (verify === "field_near_shop_dwell") chk = checkFieldNearShopDwell(entries, shops);
      else if (verify === "field_offers_seen") chk = checkFieldOffersSeen(entries, shops);
      else {
        row.detail = `Unknown verify type: ${verify}`;
        return row;
      }

      row.status = chk.pass ? "pass" : "fail";
      row.detail = chk.detail;
      return row;
    });
  }

  global.ScenarioPlaybook = { evaluatePlaybook };
})(typeof globalThis !== "undefined" ? globalThis : window);
