/** Deal alert test log analysis — browser (mirrors field_log_analyzer.py). */
(function (global) {
  function parseFieldLog(raw) {
    if (Array.isArray(raw)) {
      return raw.filter((e) => e && typeof e === "object");
    }
    const text = String(raw || "").trim();
    if (!text) throw new Error("Paste field log JSON from the phone");
    let data = JSON.parse(text);
    if (data && typeof data === "object" && !Array.isArray(data) && data.entries) {
      data = data.entries;
    }
    if (!Array.isArray(data)) throw new Error("Expected a JSON array of log entries");
    return data.filter((e) => e && typeof e === "object");
  }

  function entryMatches(entry, rule) {
    const opp = Number(entry.opportunitySum || 0);
    if ("opportunitySumLt" in rule && !(opp < Number(rule.opportunitySumLt))) return false;
    if ("opportunitySumLte" in rule && !(opp <= Number(rule.opportunitySumLte))) return false;
    if ("opportunitySumGt" in rule && !(opp > Number(rule.opportunitySumGt))) return false;
    if ("opportunitySumGte" in rule && !(opp >= Number(rule.opportunitySumGte))) return false;

    for (const key of ["gateDecision", "suppressReason", "hardSuppressRule", "activity", "planStyle"]) {
      if (!(key in rule)) continue;
      const expected = rule[key];
      const actual = entry[key];
      if (Array.isArray(expected)) {
        if (!expected.includes(actual)) return false;
      } else if (actual !== expected) return false;
    }

    if ("activityIn" in rule && !rule.activityIn.includes(entry.activity)) return false;
    if ("activityNotIn" in rule && rule.activityNotIn.includes(entry.activity)) return false;

    for (const boolKey of ["surfaced", "wouldDeliver", "stochasticSend"]) {
      if (!(boolKey in rule)) continue;
      if (Boolean(entry[boolKey]) !== Boolean(rule[boolKey])) return false;
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

  function runIdsMatch(expected, uploaded) {
    const exp = String(expected || "").trim();
    const up = String(uploaded || "").trim();
    if (!exp || !up) return false;
    if (exp === up) return true;
    const expShort = exp.split("-")[0];
    const upShort = up.split("-")[0];
    return up === expShort || exp === upShort || expShort === upShort;
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
        detail: `Run id mismatch — console ${expectedShort}, log ${uploadRun.split("-")[0]}`,
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
        detail: `Scenario mismatch — console ${expectedScenario}, log ${uploadScenario}`,
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
    const entries = parseFieldLog(log);
    const rules = scenario.fieldLogRules || {};
    const minEntries = Number(rules.minEntries ?? 1);
    const checks = [];
    let failed = false;

    for (const sync of syncChecks(
      scenario.id,
      runMeta,
      opts.uploadScenarioId,
      opts.uploadRunId,
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

    (rules.passIfAny || []).forEach((rule, i) => {
      const label = rule.label || `pass_if_any_${i + 1}`;
      const hits = findMatchingEntries(entries, rule);
      const ok = hits.length > 0;
      checks.push({
        id: label,
        pass: ok,
        detail: rule.description || label,
        matchedEntryIndexes: hits.slice(0, 5),
      });
      if (!ok) failed = true;
    });

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
    };
  }

  global.ScenarioFieldLog = { parseFieldLog, analyzeFieldLog, buildLlmReviewPrompt };
})(typeof globalThis !== "undefined" ? globalThis : window);
