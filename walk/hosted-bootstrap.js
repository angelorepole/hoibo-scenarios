(function () {
  const host = window.location.hostname;
  const isLocal = host === "127.0.0.1" || host === "localhost";
  if (isLocal) return;

  const KEY = "scenarios_admin_api_key";
  const ENV_KEY = "scenarios_console_env";

  function adminKey() {
    let k = sessionStorage.getItem(KEY);
    if (!k) {
      k = prompt("Admin API key (from .env.stage / Supabase secrets — not stored in git):");
      if (k) sessionStorage.setItem(KEY, k.trim());
    }
    return (k || "").trim();
  }

  let envConfigCache = null;
  let catalogCache = null;

  async function getEnvConfig() {
    if (!envConfigCache) {
      envConfigCache = await ScenarioHostedCrypto.fetchEncryptedJson(
        "../environments.enc.json",
        adminKey(),
      );
    }
    return envConfigCache;
  }

  async function getCatalog() {
    if (!catalogCache) {
      catalogCache = await ScenarioHostedCrypto.fetchEncryptedJson(
        "../scenarios/catalog.enc.json",
        adminKey(),
      );
    }
    return catalogCache;
  }

  function mapScenarioBase(s) {
    return {
      id: s.id,
      label: s.label || s.id,
      purpose: s.purpose || "",
      summary: s.summary || "",
      category: s.category || "intent",
      engineRef: s.engineRef || "",
      acceptanceIds: s.acceptanceIds || [],
      multiDay: !!s.multiDay,
      playbook: s.playbook || [],
      fieldLogExpect: s.fieldLogExpect || [],
      fieldLogRules: s.fieldLogRules || {},
      passCriteria: s.passCriteria || s.fieldLogExpect || [],
      cleanupWhen: s.cleanupWhen || "",
    };
  }

  async function mapScenarioList(catalog) {
    const copy =
      typeof ScenarioDisplay !== "undefined" ? await ScenarioDisplay.loadHumanCopy() : {};
    return (catalog.scenarios || catalog.presets || []).map((s) => {
      const merged =
        typeof ScenarioDisplay !== "undefined"
          ? ScenarioDisplay.applyHumanCopy({ ...s, ...mapScenarioBase(s) }, copy)
          : mapScenarioBase(s);
      return {
        ...mapScenarioBase(merged),
        passCriteria: merged.passCriteria || merged.fieldLogExpect || [],
        fieldLogExpect: merged.passCriteria || merged.fieldLogExpect || [],
      };
    });
  }

  let consoleEnv = sessionStorage.getItem(ENV_KEY) || "stage";

  async function envStatus() {
    const cfg = await getEnvConfig();
    const block = cfg[consoleEnv] || {};
    const preLaunch = !!cfg.preLaunchScenarioTesting;
    let message = "Hosted Scenarios — view active run, map, and log check. Run/Finish on Mac.";
    if (consoleEnv === "prod" && preLaunch) {
      message = "PROD pre-launch — scenarios only. No DB reset from here.";
    }
    return {
      ok: true,
      console: { env: consoleEnv, label: block.label || consoleEnv.toUpperCase() },
      app: { env: "unknown", label: "—" },
      preLaunchScenarioTesting: preLaunch,
      mismatch: false,
      message,
    };
  }

  async function supabaseFn(name, body) {
    const cfg = await getEnvConfig();
    const env = cfg[consoleEnv];
    if (!env || !env.supabaseUrl) throw new Error("Unknown env: " + consoleEnv);
    const res = await fetch(env.supabaseUrl + "/functions/v1/" + name, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-api-key": adminKey(),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) throw new Error(data.error || "HTTP " + res.status);
    return data;
  }

  async function findScenario(scenarioId) {
    const catalog = await getCatalog();
    const scenarios = await mapScenarioList(catalog);
    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (!scenario) throw new Error("Unknown scenario: " + scenarioId);
    const raw = (catalog.scenarios || catalog.presets || []).find((s) => s.id === scenarioId);
    return { ...(raw || {}), ...scenario };
  }

  async function loadRunMeta(runId) {
    if (!runId) return null;
    try {
      const data = await supabaseFn("scenario-runs", {
        action: "get",
        run_id: runId,
        console_env: consoleEnv,
      });
      return data.run || null;
    } catch (_) {
      return { run_id: runId, note: "Run not found in storage" };
    }
  }

  window.__hostedScenariosApi = async function (path, opts) {
    opts = opts || {};
    const method = (opts.method || "GET").toUpperCase();
    const body = opts.body ? JSON.parse(opts.body) : {};

    const MAC_ONLY =
      "Run, Finish, and Abandon are Mac Dev Console only (127.0.0.1:8765/walk/). This site is view + log check.";
    function rejectMacOnly() {
      throw new Error(MAC_ONLY);
    }
    const macOnlyPaths =
      (path === "/api/scenarios/run" && (method === "POST" || method === "PATCH")) ||
      (path === "/api/scenarios/abandon" && method === "POST") ||
      (path === "/api/scenarios/cleanup" && method === "POST") ||
      (path === "/api/scenarios/redeem" && method === "POST");
    if (macOnlyPaths) rejectMacOnly();

    if (path === "/api/environment") return envStatus();
    if (path === "/api/environment/target" && method === "POST") {
      consoleEnv = (body.target || "stage").toLowerCase();
      sessionStorage.setItem(ENV_KEY, consoleEnv);
      return envStatus();
    }
    if (path === "/api/scenarios/catalog") {
      const catalog = await getCatalog();
      const scenarios = await mapScenarioList(catalog);
      return { ok: true, catalog, scenarios };
    }
    if (path === "/api/scenarios/devices") {
      try {
        const devices = await ScenarioHostedCrypto.fetchEncryptedJson(
          "../devices.enc.json",
          adminKey(),
        );
        return { ok: true, devices: devices.devices || devices };
      } catch (_) {
        return { ok: true, devices: [] };
      }
    }
    if (path === "/api/scenarios/phones") {
      const d = await window.__hostedScenariosApi("/api/scenarios/devices");
      const phones = (d.devices || [])
        .filter((x) => (x.roles || []).includes("customer"))
        .filter((x) => (x.backend_env || "stage") === consoleEnv)
        .map((x) => ({
          slot: x.slot,
          name: x.name,
          device_id: x.id || x.device_id,
          app_id: String(x.customer_app_id || x.app_id || "").trim() || null,
          backend_env: x.backend_env || "stage",
          roles: x.roles || ["customer"],
        }));
      return { ok: true, phones };
    }
    if (path === "/api/scenarios/runs") {
      const data = await supabaseFn("scenario-runs", {
        action: "list",
        console_env: consoleEnv,
        active_only: true,
        limit: 20,
      });
      return { ok: true, runs: data.runs || [] };
    }
    if (path === "/api/scenarios/history") {
      const data = await supabaseFn("scenario-runs", {
        action: "list",
        console_env: consoleEnv,
        limit: 100,
      });
      return { ok: true, history: data.runs || [] };
    }
    if (path.startsWith("/api/scenarios/run/") && method === "GET") {
      const runId = path.split("/").pop();
      const data = await supabaseFn("scenario-runs", {
        action: "get",
        run_id: runId,
        console_env: consoleEnv,
      });
      return { ok: true, run: data.run };
    }
    if (path === "/api/scenarios/analyze-log" && method === "POST") {
      const scenarioId = body.scenario_id || body.preset_id;
      if (!scenarioId) throw new Error("scenario_id required");
      const log = body.log ?? body.logJson ?? body.log_json;
      if (log == null) throw new Error("log or logJson required");
      if (!globalThis.ScenarioFieldLog) {
        throw new Error("field-log-analyze.js not loaded");
      }
      const scenario = await findScenario(String(scenarioId));
      const runMeta = body.run_id ? await loadRunMeta(String(body.run_id)) : null;
      const result = globalThis.ScenarioFieldLog.analyzeFieldLog(scenario, log, runMeta);
      const playbookSteps = globalThis.ScenarioPlaybook
        ? globalThis.ScenarioPlaybook.evaluatePlaybook(scenario, {
            runMeta,
            log,
            runActive: Boolean(runMeta?.shops?.length),
            fieldLogOk: result.ok,
          })
        : [];
      if (body.run_id && body.app_id) {
        try {
          const run = runMeta || (await loadRunMeta(String(body.run_id)));
          if (run?.run_id) {
            const checks = run.field_log_checks || [];
            checks.push({
              at: new Date().toISOString(),
              app_id: body.app_id,
              ok: result.ok,
              summary: result.summary,
            });
            run.field_log_checks = checks;
            await supabaseFn("scenario-runs", { action: "save", run, console_env: consoleEnv });
          }
        } catch (_) {
          /* optional persist */
        }
      }
      return { ok: true, ...result, playbookSteps };
    }
    if (path === "/api/scenarios/playbook-status" && method === "POST") {
      const scenarioId = body.scenario_id || body.preset_id;
      if (!scenarioId) throw new Error("scenario_id required");
      if (!globalThis.ScenarioPlaybook) {
        throw new Error("playbook-evaluate.js not loaded");
      }
      const scenario = await findScenario(String(scenarioId));
      const runMeta = body.run_id ? await loadRunMeta(String(body.run_id)) : null;
      const log = body.log ?? body.logJson ?? body.log_json;
      const runActive = body.run_active != null ? Boolean(body.run_active) : Boolean(runMeta);
      const playbookSteps = globalThis.ScenarioPlaybook.evaluatePlaybook(scenario, {
        runMeta,
        log,
        runActive,
        fieldLogOk: body.field_log_ok,
      });
      return { ok: true, playbookSteps };
    }

    if (path.startsWith("/api/scenarios/field-logs")) {
      if (method === "GET") {
        const q = new URL(path, "http://x").searchParams;
        const data = await supabaseFn("list-field-logs", {
          app_id: q.get("app_id") || undefined,
          limit: Number(q.get("limit") || 5),
          console_env: consoleEnv,
        });
        return { ok: true, uploads: data.uploads || [] };
      }
      return supabaseFn("list-field-logs", { ...body, console_env: consoleEnv });
    }

    if (path === "/api/scenarios/run" && method === "POST") {
      const catalog = await getCatalog();
      const scenarios = catalog.scenarios || catalog.presets || [];
      const scenario = scenarios.find((s) => s.id === body.preset_id);
      if (!scenario) throw new Error("Unknown scenario: " + body.preset_id);
      const data = await supabaseFn("scenario-runs", {
        action: "run",
        console_env: consoleEnv,
        preset_id: body.preset_id,
        scenario,
        lat: body.lat,
        lng: body.lng,
        radius_m: body.radius_m,
        devices: body.devices,
        confirm_prod: body.confirm_prod,
        default_radius_m: catalog.defaultRadiusM,
      });
      return {
        ok: true,
        run: data.run,
        prep: data.prep,
        seedOutput: data.seedOutput,
      };
    }

    throw new Error("Unsupported hosted scenarios API: " + path);
  };
})();

