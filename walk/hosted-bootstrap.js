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

  function mapScenarioList(catalog) {
    return (catalog.scenarios || catalog.presets || []).map((s) => ({
      id: s.id,
      label: s.label || s.id,
      summary: s.summary || "",
      category: s.category || "intent",
      engineRef: s.engineRef || "",
      acceptanceIds: s.acceptanceIds || [],
      multiDay: !!s.multiDay,
      playbook: s.playbook || [],
      fieldLogExpect: s.fieldLogExpect || [],
    }));
  }

  let consoleEnv = sessionStorage.getItem(ENV_KEY) || "stage";

  async function envStatus() {
    const cfg = await getEnvConfig();
    const block = cfg[consoleEnv] || {};
    const preLaunch = !!cfg.preLaunchScenarioTesting;
    let message = "Hosted Scenarios — run log & field logs via Supabase.";
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

  window.__hostedScenariosApi = async function (path, opts) {
    opts = opts || {};
    const method = (opts.method || "GET").toUpperCase();
    const body = opts.body ? JSON.parse(opts.body) : {};

    if (path === "/api/environment") return envStatus();
    if (path === "/api/environment/target" && method === "POST") {
      consoleEnv = (body.target || "stage").toLowerCase();
      sessionStorage.setItem(ENV_KEY, consoleEnv);
      return envStatus();
    }
    if (path === "/api/scenarios/catalog") {
      const catalog = await getCatalog();
      return { ok: true, catalog, scenarios: mapScenarioList(catalog) };
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
      const phones = (d.devices || []).filter((x) => (x.roles || []).includes("customer"));
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
    if (path === "/api/scenarios/run" && method === "PATCH") {
      return supabaseFn("scenario-runs", { action: "save", run: body.run });
    }
    if (path === "/api/scenarios/abandon" || path === "/api/scenarios/cleanup") {
      const runId = body.run_id;
      if (runId) {
        await supabaseFn("scenario-runs", {
          action: "delete",
          run_id: runId,
          console_env: consoleEnv,
        });
      }
      return { ok: true };
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

    throw new Error(
      "Hosted mode: use Mac console for redeem / analyze (" + path + ")",
    );
  };
})();
