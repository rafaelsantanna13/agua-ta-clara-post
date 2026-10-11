import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("admin-launcher.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const defaultConfig = JSON.parse(fs.readFileSync("admin-config.json", "utf8"));
const docs = "https://github.com/rafaelsantanna13/agua-ta-clara/blob/main/integrations/cloudflare/README.md";
const valid = "https://agua-ta-clara-admin.user-name.workers.dev";

for (const id of ["adminMode", "updateToday", "updateTomorrow", "workerUrl", "saveWorkerUrl", "workerSaveResult"]) {
  assert.ok(html.includes('id="' + id + '"'), "missing " + id);
}
assert.ok(html.includes("admin-launcher.js"));
assert.ok(html.includes(docs));
assert.equal(defaultConfig.worker_url, null);

function makeApp({ config = defaultConfig, stored = null, networkFailure = false } = {}) {
  const store = new Map(stored ? [["agua-ta-clara-admin-worker-url-v1", stored]] : []);
  const elements = Object.fromEntries(
    ["adminMode", "updateToday", "updateTomorrow", "workerUrl", "saveWorkerUrl", "workerSaveResult"]
      .map(id => [id, { value: "", textContent: "", className: "", href: "", target: "", rel: "",
                    addEventListener(event, handler) { this[event] = handler; } }])
  );
  const document = { readyState: "complete", getElementById: id => elements[id] };
  const window = { localStorage: { getItem: k => store.get(k) ?? null,
                                 setItem: (k, v) => store.set(k, v),
                                 removeItem: k => store.delete(k) } };
  const requested = [];
  async function fetch(url, opts) {
    requested.push([url, opts]);
    if (networkFailure) throw new Error("simulated network down");
    return { ok: true, json: async () => config };
  }
  vm.runInNewContext(source, { URL, document, window, fetch, Date }, { timeout: 1000 });
  return { elements, window, store, requested };
}

const app = makeApp();
await new Promise(setImmediate);
const { validateWorkerUrl } = app.window.ATCAdmin;
assert.equal(validateWorkerUrl(valid + "/"), valid);
assert.equal(validateWorkerUrl(valid + "/?kind=morning_nowcast"), null);
assert.equal(validateWorkerUrl("https://workers.dev/"), null);
assert.equal(validateWorkerUrl("https://fake.workers.dev.attacker.com/"), null);
assert.equal(validateWorkerUrl("http://safe.workers.dev"), null);
assert.equal(validateWorkerUrl("https://x.workers.dev@attacker.example"), null);
assert.equal(validateWorkerUrl(""), null);

assert.match(app.elements.adminMode.textContent, /ainda não configurado/);
assert.match(app.elements.updateToday.href, /github\.com/);
assert.equal(app.elements.updateToday.target, "_blank");
assert.equal(app.elements.updateTomorrow.target, "_blank");

app.elements.workerUrl.value = "https://fake.workers.dev.attacker.com";
app.elements.saveWorkerUrl.click();
assert.match(app.elements.workerSaveResult.textContent, /Use apenas o endereço HTTPS/);
assert.match(app.elements.updateToday.href, /github\.com/);

app.elements.workerUrl.value = valid + "/";
app.elements.saveWorkerUrl.click();
assert.equal(app.elements.updateToday.href, valid + "/?kind=morning_nowcast");
assert.equal(app.elements.updateTomorrow.href, valid + "/?kind=tomorrow_forecast");
assert.equal(app.elements.updateToday.target, "_self");
assert.equal(app.store.get("agua-ta-clara-admin-worker-url-v1"), valid);
assert.match(app.elements.adminMode.textContent, /Acesso direto protegido/);
assert.doesNotMatch(source + html, /ghp_[A-Za-z0-9]{25,}/);

const restored = makeApp({ stored: valid, networkFailure: true });
await new Promise(setImmediate);
assert.equal(restored.elements.updateToday.href, valid + "/?kind=morning_nowcast");
assert.equal(restored.requested.length, 0);

const configured = makeApp({ config: { schema_version: 1, worker_url: valid } });
await new Promise(setImmediate);
assert.equal(configured.elements.updateTomorrow.href, valid + "/?kind=tomorrow_forecast");

const offline = makeApp({ networkFailure: true });
await new Promise(setImmediate);
assert.match(offline.elements.updateToday.href, /github\.com/);
console.log("Public dashboard: secure URL validation, stored URL, non-secret config and GitHub fallback OK");
