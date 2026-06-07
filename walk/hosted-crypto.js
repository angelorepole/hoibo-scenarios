/**
 * Decrypt scenario JSON blobs for GitHub Pages (AES-256-GCM, key = SHA-256(admin API key)).
 * Must stay in sync with dev_console/scripts/scenario_json_crypto.ts
 */
async function scenarioCryptoKey(adminKey) {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(adminKey));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["decrypt"]);
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * @param {string} adminKey
 * @param {{ v: number, alg: string, iv: string, data: string }} envelope
 * @returns {Promise<unknown>}
 */
async function decryptScenarioJsonEnvelope(adminKey, envelope) {
  if (!envelope || envelope.v !== 1 || envelope.alg !== "A256GCM") {
    throw new Error("Unsupported encrypted JSON envelope");
  }
  const key = await scenarioCryptoKey(adminKey);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBytes(envelope.iv) },
    key,
    b64ToBytes(envelope.data),
  );
  return JSON.parse(new TextDecoder().decode(plain));
}

/**
 * @param {string} path e.g. ../scenarios/catalog.enc.json
 * @param {string} adminKey
 */
async function fetchEncryptedJson(path, adminKey) {
  const res = await fetch(path);
  if (!res.ok) throw new Error("Missing " + path);
  const envelope = await res.json();
  return decryptScenarioJsonEnvelope(adminKey, envelope);
}

window.ScenarioHostedCrypto = {
  fetchEncryptedJson,
  decryptScenarioJsonEnvelope,
};
