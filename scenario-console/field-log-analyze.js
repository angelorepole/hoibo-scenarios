/** Deal alert test log analysis — browser (mirrors field_log_analyzer.py). */
(function (global) {
  function parseFieldLogUpload(raw) {
    if (Array.isArray(raw)) {
      return { entries: raw.filter((e) => e && typeof e === "object") };
    }
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      if (Array.isArray(raw.entries)) {
        return {
          entries: raw.entries.filter((e) => e && typeof e === "object"),
          memory_trace: raw.memory_trace,
          scenario_id: raw.scenario_id,
          run_id: raw.run_id,
        };
      }
      if ("opportunitySum" in raw || "gateDecision" in raw) {
        return { entries: [raw] };
      }
    }
    const text = String(raw || "").trim();
    if (!text) throw new Error("Paste field log JSON from the phone");
    return parseFieldLogUpload(JSON.parse(text));
  }

  function parseFieldLog(raw) {
    return parseFieldLogUpload(raw).entries;
  }

  function entryMatches(entry, rule) {
    const opp = Number(entry.opportunitySum || 0);
    if ("opportunitySumLt" in rule && !(opp < Number(rule.opportunitySumLt))) return false;
    if ("opportunitySumLte" in rule && !(opp <= Number(rule.opportunitySumLte))) return false;
    if ("opportunitySumGt" in rule && !(opp > Number(rule.opportunitySumGt))) return false;
    if ("opportunitySumGte" in rule && !(opp >= Number(rule.opportunitySumGte))) return false;

    for (const key of [
      "gateDecision", "suppressReason", "hardSuppressRule", "activity", "planStyle",
      "wakeSource", "placeKind", "slotKind", "wifiHint", "lunchWindow", "mealCorridor",
    ]) {
      if (!(key in rule)) continue;
      const expected = rule[key];
      const actual = entry[key];
      if (Array.isArray(expected)) {
        if (!expected.includes(actual)) return false;
      } else if (actual !== expected) return false;
    }

    if ("activityIn" in rule && !rule.activityIn.includes(entry.activity)) return false;
    if ("activityNotIn" in rule && rule.activityNotIn.includes(entry.activity)) return false;

    for (const boolKey of [
      "surfaced", "wouldDeliver", "stochasticSend", "realOuting", "inLunchWindow",
      "onRouteOnTime", "nearStationCluster", "carToWalk", "insideRingFromAnchor",
      "anchorEnter", "anchorExit", "memoryColdStart",
    ]) {
      if (!(boolKey in rule)) continue;
      if (Boolean(entry[boolKey]) !== Boolean(rule[boolKey])) return false;
    }

    if ("intentScoreGte" in rule && Number(entry.intentScore || 0) < Number(rule.intentScoreGte)) {
      return false;
    }
    if ("intentScoreLt" in rule && Number(entry.intentScore || 0) >= Number(rule.intentScoreLt)) {
      return false;
    }
    if ("slotStrengthGte" in rule && Number(entry.slotStrength || 0) < Number(rule.slotStrengthGte)) {
      return false;
    }

    if ("notificationSummaryExcludes" in rule) {
      const summary = String(entry.notificationSummary || "").toLowerCase();
      for (const token of rule.notificationSummaryExcludes) {
        if (summary.includes(String(token).toLowerCase())) return false;
      }
    }

    if ("offerCountGte" in rule) {
      if (Number(entry.offerCount || 0) < Number(rule.offerCountGte)) return false;
    }

    return true;
  }

  function findMatchingEntries(entries, rule) {
    const hits = [];
    entries.forEach((e, i) => {
      if (entryMatches(e, rule)) hits.push(i);
    });
    return hits;
  }

  function summarize(checks, failed) {
    if (!checks.length) return "No automated rules for this scenario — use LLM review.";
    const auto = checks.filter((c) => c.pass !== null && c.pass !== undefined);
    const passed = auto.filter((c) => c.pass).length;
    if (failed) {
      const bad = auto.filter((c) => !c.pass).map((c) => c.id);
      return `Automated check FAILED (${passed}/${auto.length}). Review: ${bad.join(", ")}.`;
    }
    const manual = checks.filter((c) => c.pass === null || c.pass === undefined);
    const extra = manual.length ? ` + ${manual.length} manual check(s)` : "";
    return `Automated check PASSED (${passed}/${auto.length})${extra}.`;
  }

  function buildLlmReviewPrompt(scenario, entries, runMeta) {
    const meta = runMeta || {};
    const logJson = JSON.stringify(entries, null, 2);
    const expect = (scenario.fieldLogExpect || []).map((line) => `- ${line}`).join("\n");
    const playbook = (scenario.playbook || [])
      .map((s) => `${s.step || "?"}. [${s.who || ""}] ${s.do || ""}`)
      .join("\n");
    return `# Walk scenario field log review

You are reviewing a **Deal alert test log** from a real phone walk.

## Scenario
- **ID:** ${scenario.id}
- **Label:** ${scenario.label}
- **Acceptance:** ${(scenario.acceptanceIds || []).join(", ")}
- **Engine ref:** ${scenario.engineRef || ""}
- **Summary:** ${scenario.summary || ""}

## Run (if any)
${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "(not linked)"}

## What the tester was supposed to do
${playbook}

## Field log — expected signals
${expect || "(see scenario doc)"}

## Log JSON (newest entries may be at end of array)
\`\`\`json
${logJson}
\`\`\`

## Your task
1. Say **PASS**, **FAIL**, or **INCONCLUSIVE** for this scenario.
2. Cite specific log entries (time, gateDecision, opportunitySum, activity, surfaced).
3. Note if GPS/distance/category settings likely explain a mismatch with seed intent.
4. For multi-day scenarios, say if affinity / weights improved vs early entries.

Be concise. Plain English.`;
  }

  function engineApi() {
    if (!global.FieldLogEngine) {
      throw new Error("field-log-engine.js not loaded");
    }
    return global.FieldLogEngine;
  }

  function evaluateEngineRules(entries, scenarioId, customRules, orGroups) {
    const api = engineApi();
    return api.evaluateEngineRules(entries, scenarioId, customRules, orGroups);
  }

  function runIdsMatch(expected, uploaded) {
    const exp = String(expected || "").trim();
    const up = String(uploaded || "").trim();
    if (!exp || !up) return false;
    if (exp === up) return true;
    const expShort = exp.split("-")[0];
    const upShort = up.split("-")[0];
    return up === expShort || exp === upShort || expShort === upShort;
  }

  function parseLogUploadMeta(raw) {
    try {
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object" || Array.isArray(data)) return {};
      return {
        scenario_id: data.scenario_id || null,
        run_id: data.run_id || null,
        uploaded_at: data.uploaded_at || null,
        memory_trace: data.memory_trace || null,
      };
    } catch (_) {
      return {};
    }
  }

  function pickCloudUpload(uploads, runMeta) {
    const rows = Array.isArray(uploads) ? [...uploads] : [];
    rows.sort((a, b) => {
      const at = Date.parse(a.uploaded_at || "") || 0;
      const bt = Date.parse(b.uploaded_at || "") || 0;
      return bt - at;
    });
    if (!rows.length) {
      return { upload: null, reason: "none", mismatch: false };
    }
    if (!runMeta?.run_id) {
      return { upload: rows[0], reason: "latest", mismatch: false };
    }
    const expected = String(runMeta.run_id);
    for (const row of rows) {
      const stamp = String(row.run_id || "").trim();
      if (stamp && runIdsMatch(expected, stamp)) {
        return { upload: row, reason: "run_match", mismatch: false };
      }
    }
    const latest = rows[0];
    const latestStamp = String(latest.run_id || "").trim();
    const mismatch = Boolean(
      latestStamp && !runIdsMatch(expected, latestStamp),
    );
    return {
      upload: latest,
      reason: mismatch ? "latest_mismatch" : "latest",
      mismatch,
    };
  }

  function validateRunSyncDiagnostic({ appId, runMeta, uploads }) {
    const steps = [];
    const app = String(appId || "").trim();

    if (!runMeta?.run_id) {
      steps.push({
        id: "console_run",
        label: "Active console run",
        ok: false,
        detail: "No active run — press Run on the scenario first.",
        fix: "Start a scenario Run from the walk console.",
      });
      return {
        ok: false,
        steps,
        summary: "No active console run.",
        recommendation: steps[0].fix,
      };
    }

    const expectedRun = String(runMeta.run_id).trim();
    const expectedShort = String(runMeta.short_id || expectedRun.split("-")[0]);
    const expectedScenario = String(
      runMeta.scenario_id || runMeta.preset_id || "",
    ).trim();
    steps.push({
      id: "console_run",
      label: "Active console run",
      ok: true,
      detail: `Expecting run ${expectedShort}${expectedScenario ? ` · ${expectedScenario}` : ""}`,
    });

    if (!app) {
      steps.push({
        id: "app_id",
        label: "Phone app id",
        ok: false,
        detail: "No app_id.",
        fix: "Match devices.json to Deal alert test log → App id on the phone.",
      });
      return { ok: false, steps, summary: "Missing app_id.", recommendation: steps[1].fix };
    }
    steps.push({ id: "app_id", label: "Phone app id", ok: true, detail: app });

    const rows = Array.isArray(uploads) ? uploads : [];
    if (!rows.length) {
      steps.push({
        id: "cloud_list",
        label: "Cloud uploads",
        ok: false,
        detail: `No uploads for ${app}.`,
        fix: "On phone: Deal alert test log → Upload log.",
      });
      return {
        ok: false,
        steps,
        summary: "No cloud uploads yet.",
        recommendation: "Walk, then upload from the phone.",
      };
    }
    steps.push({
      id: "cloud_list",
      label: "Cloud uploads",
      ok: true,
      detail: `${rows.length} file(s) in storage`,
    });

    const picked = pickCloudUpload(rows, runMeta);
    const upload = picked.upload;
    const stampRun = String(upload?.run_id || "").trim();
    const stampScenario = String(upload?.scenario_id || "").trim();
    const stampShort = stampRun ? stampRun.split("-")[0] : "?";
    const uploadedAt = String(upload?.uploaded_at || "?");

    if (picked.reason === "run_match") {
      steps.push({
        id: "cloud_pick",
        label: "Pick upload for this run",
        ok: true,
        detail: `Found upload stamped ${stampShort} · ${uploadedAt}`,
      });
    } else if (picked.mismatch) {
      steps.push({
        id: "cloud_pick",
        label: "Pick upload for this run",
        ok: false,
        detail: `Latest is ${stampShort} (${stampScenario || "?"}) — no upload matches run ${expectedShort}.`,
        fix: "Upload from phone when Run sync matches the console banner.",
      });
    } else {
      steps.push({
        id: "cloud_pick",
        label: "Pick upload for this run",
        ok: true,
        detail: `Using latest upload · ${uploadedAt}`,
      });
    }

    const runOk = Boolean(stampRun) && runIdsMatch(expectedRun, stampRun);
    steps.push({
      id: "stamp_run",
      label: "Cloud run stamp",
      ok: runOk,
      detail: runOk
        ? `Matches (${expectedShort})`
        : `Console expects ${expectedShort}, cloud stamped ${stampShort || "(missing)"}`,
      fix: runOk ? undefined : "Phone Run sync must match console — then upload again.",
    });

    let scenarioOk = true;
    if (expectedScenario && stampScenario) {
      scenarioOk = stampScenario === expectedScenario;
      steps.push({
        id: "stamp_scenario",
        label: "Cloud scenario stamp",
        ok: scenarioOk,
        detail: scenarioOk
          ? `Matches (${expectedScenario})`
          : `Console expects ${expectedScenario}, cloud stamped ${stampScenario}`,
        fix: scenarioOk ? undefined : "Re-run scenario from Mac console, then upload.",
      });
    }

    const allOk = runOk && scenarioOk && !picked.mismatch;
    return {
      ok: allOk,
      steps,
      summary: allOk ? "Run sync OK — safe to Check log." : "Run sync FAILED — fix before Check log.",
      recommendation: allOk
        ? `Ready for Check log — ${upload?.entry_count ?? "?"} entries stamped ${stampShort}.`
        : `Cloud still has ${stampShort} / ${stampScenario || "?"}. Upload when phone shows ${expectedShort}.`,
      picked_upload: upload,
      pick_reason: picked.reason,
    };
  }

  /**
   * Build analyze-log / report-log POST body.
   * File stamp (upload_*) must stay separate from active console run (console_run_*).
   */
  function buildFieldLogRequestBody(raw, context) {
    const ctx = context || {};
    const meta = ctx.lastCloudLogMeta || {};
    const body = {
      scenario_id: ctx.activeScenarioId,
      logJson: raw,
    };
    const parsed = parseLogUploadMeta(raw);
    const fileScenario = parsed.scenario_id || meta.scenario_id || null;
    const fileRun = parsed.run_id || meta.run_id || null;
    const fileUploadedAt = parsed.uploaded_at || meta.uploaded_at || null;
    const uploadMemory = parsed.memory_trace || meta.memory_trace || null;
    if (fileScenario) body.upload_scenario_id = fileScenario;
    if (fileRun) body.upload_run_id = fileRun;
    if (fileUploadedAt) body.log_uploaded_at = fileUploadedAt;
    if (meta.scenario_id) body.cloud_upload_scenario_id = meta.scenario_id;
    if (meta.run_id) body.cloud_upload_run_id = meta.run_id;
    const run = ctx.currentRun;
    if (run?.run_id) {
      body.run_id = run.run_id;
      body.console_run_id = run.run_id;
      if (run.started_at) body.console_run_started_at = run.started_at;
    }
    if (uploadMemory) body.memory_trace = uploadMemory;
    if (ctx.appId) body.app_id = ctx.appId;
    return body;
  }

  function syncChecks(scenarioId, runMeta, uploadScenarioId, uploadRunId) {
    if (!runMeta?.run_id) return [];
    const expectedRun = String(runMeta.run_id).trim();
    const expectedShort = String(runMeta.short_id || expectedRun.split("-")[0]);
    const expectedScenario = String(
      runMeta.scenario_id || runMeta.preset_id || scenarioId,
    ).trim();
    const checks = [];
    const uploadRun = String(uploadRunId || "").trim();
    if (!uploadRun) {
      checks.push({
        id: "run_sync",
        pass: false,
        detail: `Log has no run id — phone field log should show ${expectedShort}. Wrong build or stale app.`,
      });
    } else if (!runIdsMatch(expectedRun, uploadRun)) {
      checks.push({
        id: "run_sync",
        pass: false,
        detail:
          `Run id mismatch — console expects ${expectedShort}, ` +
          `cloud upload stamped ${uploadRun.split("-")[0]}. ` +
          "Re-upload from phone (Run sync card must match console).",
      });
    } else {
      checks.push({
        id: "run_sync",
        pass: true,
        detail: `Run id matches console (${expectedShort})`,
      });
    }
    const uploadScenario = String(uploadScenarioId || "").trim();
    if (uploadScenario && uploadScenario !== expectedScenario) {
      checks.push({
        id: "scenario_sync",
        pass: false,
        detail:
          `Scenario mismatch — console expects ${expectedScenario}, ` +
          `cloud upload stamped ${uploadScenario}. Re-upload from phone.`,
      });
    } else if (uploadScenario) {
      checks.push({
        id: "scenario_sync",
        pass: true,
        detail: `Scenario matches console (${expectedScenario})`,
      });
    }
    return checks;
  }

  function analyzeFieldLog(scenario, log, runMeta, options) {
    if (!scenario?.id) throw new Error("scenario required");
    const opts = options || {};
    const upload = parseFieldLogUpload(log);
    const entries = upload.entries;
    const memoryTrace = upload.memory_trace;
    const rules = scenario.fieldLogRules || {};
    const minEntries = Number(rules.minEntries ?? 1);
    const checks = [];
    let failed = false;

    const effectiveUploadScenario =
      String(opts.uploadScenarioId || upload.scenario_id || "").trim() || null;
    const effectiveUploadRun =
      String(opts.uploadRunId || upload.run_id || "").trim() || null;

    for (const sync of syncChecks(
      scenario.id,
      runMeta,
      effectiveUploadScenario,
      effectiveUploadRun,
    )) {
      checks.push(sync);
      if (sync.pass === false) failed = true;
    }

    if (entries.length < minEntries) {
      checks.push({
        id: "min_entries",
        pass: false,
        detail: `Need at least ${minEntries} log entries, got ${entries.length}`,
      });
      failed = true;
    } else {
      checks.push({ id: "min_entries", pass: true, detail: `${entries.length} entries` });
    }

    const passIfAny = rules.passIfAny || [];
    if (passIfAny.length > 0) {
      let anyPassed = false;
      passIfAny.forEach((rule, i) => {
        const label = rule.label || `pass_if_any_${i + 1}`;
        const hits = findMatchingEntries(entries, rule);
        const ok = hits.length > 0;
        if (ok) anyPassed = true;
        checks.push({
          id: label,
          pass: ok,
          detail: rule.description || label,
          matchedEntryIndexes: hits.slice(0, 5),
        });
      });
      if (!anyPassed) failed = true;
    }

    (rules.failIfAny || []).forEach((rule, i) => {
      const label = rule.label || `fail_if_any_${i + 1}`;
      const hits = findMatchingEntries(entries, rule);
      const ok = hits.length === 0;
      checks.push({
        id: label,
        pass: ok,
        detail: rule.description || label,
        matchedEntryIndexes: ok ? [] : hits.slice(0, 5),
      });
      if (!ok) failed = true;
    });

    (rules.manualNotes || []).forEach((note) => {
      checks.push({ id: "manual", pass: null, detail: note });
    });

    function formatOfferRadius(m) {
      const rounded = Math.round(Number(m));
      if (rounded >= 1000 && rounded % 1000 === 0) return `${rounded / 1000} km`;
      return `${rounded} m`;
    }

    function settingsFromEntries(list) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const raw = list[i]?.userSettings;
        if (raw && typeof raw === "object") return raw;
      }
      return null;
    }

    function evaluatePhoneSettings(list, expected) {
      if (!expected || !Object.keys(expected).length) return [];
      const actual = settingsFromEntries(list);
      if (!actual) {
        return [{
          id: "phone-settings-logged",
          pass: false,
          detail:
            "Log has no phone settings — update the walk-test app, re-walk, and upload again.",
        }];
      }
      const out = [];
      if (expected.offerRadiusM != null) {
        const want = Math.round(expected.offerRadiusM);
        const got = Math.round(Number(actual.offerRadiusM || 0));
        const ok = got === want;
        out.push({
          id: "phone-offer-radius",
          pass: ok,
          detail: ok
            ? `Offer radius ${formatOfferRadius(got)} (matches scenario)`
            : `You should have set Offer radius to ${formatOfferRadius(want)} — ` +
              `log shows ${formatOfferRadius(got)}. ` +
              "Fix: Bottom tab Settings → Offer radius.",
        });
      }
      if (expected.dealAlertsOn != null) {
        const got = actual.dealAlertsOn !== false;
        const ok = got === expected.dealAlertsOn;
        out.push({
          id: "phone-deal-alerts",
          pass: ok,
          detail: ok
            ? `Deal alerts ${got ? "ON" : "OFF"} (matches scenario)`
            : expected.dealAlertsOn
              ? "You should have turned Deal alerts ON — log shows OFF. " +
                "Fix: Bottom tab Settings → Notifications → Deal alerts."
              : "Scenario needs Deal alerts OFF — log shows ON.",
        });
      }
      if (expected.disabledCategories?.length) {
        const enabled = new Set(actual.enabledCategories || []);
        const stillOn = expected.disabledCategories.filter((c) => enabled.has(c));
        const ok = stillOn.length === 0;
        out.push({
          id: "phone-categories",
          pass: ok,
          detail: ok
            ? "Category toggles match scenario"
            : `These should be OFF but log shows ON: ${stillOn.join(", ")}. ` +
              "Fix: Settings → Notifications → What you're into.",
        });
      }
      return out;
    }

    for (const phone of evaluatePhoneSettings(entries, scenario.fieldLogPhoneSettings)) {
      checks.push(phone);
      if (phone.pass === false) failed = true;
    }

    const orGroups =
      rules.enginePassIfAny ||
      scenario.enginePassIfAny ||
      engineApi().WALK_ENGINE_PASS_IF_ANY[scenario.id];
    for (const engine of evaluateEngineRules(
      entries,
      scenario.id,
      scenario.fieldLogEngineRules,
      orGroups,
    )) {
      checks.push(engine);
      if (engine.pass === false) failed = true;
    }

    const expectedPhone = scenario.fieldLogPhoneSettings;
    if (expectedPhone?.offerRadiusM) {
      const actual = settingsFromEntries(entries);
      if (actual?.offerRadiusM) {
        const want = Math.round(expectedPhone.offerRadiusM);
        const got = Math.round(Number(actual.offerRadiusM));
        if (got < want) {
          const hint =
            `Offer-radius-density failed partly because Offer radius was ${formatOfferRadius(got)} ` +
            `(scenario needs ${formatOfferRadius(want)}).`;
          const density = checks.find((c) => c.id === "offer-radius-density" && c.pass === false);
          if (density) density.detail = `${density.detail} ${hint}`;
        }
      }
    }

    for (const mem of engineApi().evaluateMemoryTraceRules(
      memoryTrace && typeof memoryTrace === "object" ? memoryTrace : null,
      rules.memoryTraceRules || [],
    )) {
      checks.push(mem);
      if (mem.pass === false) failed = true;
    }

    function entryCoords(entry) {
      const lat = entry.lat;
      const lng = entry.lng;
      if (typeof lat !== "number" || typeof lng !== "number") return null;
      return { lat, lng };
    }

    function haversineM(a, b) {
      const R = 6371000;
      const toRad = (d) => (d * Math.PI) / 180;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const s1 = Math.sin(dLat / 2);
      const s2 = Math.sin(dLng / 2);
      const h = s1 * s1 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2;
      return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
    }

    function maxDisplacement(list) {
      const coords = list.map(entryCoords).filter(Boolean);
      if (coords.length < 2) return 0;
      let max = 0;
      for (let i = 0; i < coords.length; i++) {
        for (let j = i + 1; j < coords.length; j++) {
          max = Math.max(max, haversineM(coords[i], coords[j]));
        }
      }
      return max;
    }

    function diagnoseMovement(list) {
      const stationary = new Set(["stationary", "still", "unknown", ""]);
      const maxDisp = maxDisplacement(list);
      const allStill = list.every((e) => stationary.has(String(e.activity || "")));
      if (allStill && maxDisp < 200) {
        return {
          kind: "playbook_incomplete",
          detail:
            "Log correctly shows you have not moved yet (still). " +
            "If you have not done the walk step, continue the playbook and upload when finished — " +
            "this is not a log bug.",
        };
      }
      if (allStill && maxDisp >= 200) {
        return {
          kind: "possible_bug",
          detail:
            `Log shows movement (~${Math.round(maxDisp)} m) but no walking or commute. ` +
            "If you did walk, check motion permissions — otherwise treat as a possible bug.",
        };
      }
      return {
        kind: "unclear",
        detail: "No walking or commute in the log. Finish the walk step if you have not yet.",
      };
    }

    let movementDiagnosis = null;
    const movementCheck = checks.find((c) => c.id === "movement-or-commute" && c.pass === false);
    if (movementCheck) {
      movementDiagnosis = diagnoseMovement(entries);
      movementCheck.detail = `${movementCheck.detail} ${movementDiagnosis.detail}`;
    }

    return {
      ok: !failed,
      scenarioId: scenario.id,
      scenarioLabel: scenario.label || scenario.id,
      acceptanceIds: scenario.acceptanceIds || [],
      entryCount: entries.length,
      checks,
      fieldLogExpect: scenario.fieldLogExpect || [],
      summary: summarize(checks, failed),
      llmPrompt: buildLlmReviewPrompt(scenario, entries, runMeta),
      movementDiagnosis,
    };
  }

  function buildEngineValidationReport(check, intent) {
    const failed = (check.checks || []).filter((c) => c.pass === false);
    const blockedIds = new Set([
      "run_sync",
      "scenario_sync",
      "verbose_log",
      "min_entries",
      "phone-settings-logged",
      "phone-offer-radius",
      "phone-deal-alerts",
      "phone-categories",
    ]);
    const isBlocked = failed.some((c) => blockedIds.has(c.id));
    const isIncomplete =
      !check.ok && !isBlocked && check.movementDiagnosis?.kind === "playbook_incomplete";
    let status = "not_working";
    let headline = "No — intent engine did not pass this scenario yet.";
    let nextStep = "Walk the scenario playbook, upload from phone, then Engine report again.";
    if (check.ok) {
      status = "working";
      headline = "Yes — intent engine is working for this scenario.";
    } else if (isBlocked) {
      status = "blocked";
      headline = "Can't tell yet — fix the upload or run setup first.";
    } else if (isIncomplete) {
      status = "incomplete";
      headline = "Not finished yet — the log looks correct so far.";
      nextStep =
        "If you have not done the walk step yet, continue the playbook and upload when finished. " +
        "Only treat movement failures as bugs if you already walked and the log still shows still.";
    } else if (check.movementDiagnosis?.kind === "possible_bug") {
      headline = "Possible bug — you moved but walking was not recorded.";
      nextStep =
        "Check Settings → Permissions (motion). If those are OK, file this log as a movement-detection bug.";
    }
    return { status, headline, nextStep, check, intent };
  }

  global.ScenarioFieldLog = {
    parseFieldLog,
    parseFieldLogUpload,
    parseLogUploadMeta,
    buildFieldLogRequestBody,
    pickCloudUpload,
    validateRunSyncDiagnostic,
    runIdsMatch,
    analyzeFieldLog,
    buildEngineValidationReport,
    buildLlmReviewPrompt,
    evaluateEngineRules,
    get WALK_FIELD_LOG_RULES() {
      return engineApi().WALK_FIELD_LOG_RULES;
    },
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
