/* Public GitHub Pages navigation ONLY. No GitHub/Cloudflare credentials here.
 * Cloudflare Access authenticates the separate workers.dev administrator site,
 * which performs the workflow dispatch using a server-side Worker secret.
 */
(function () {
  "use strict";

  const LOCAL_KEY = "agua-ta-clara-admin-worker-url-v1";
  const GITHUB_ACTIONS = {
    today: "https://github.com/rafaelsantanna13/agua-ta-clara/actions/workflows/daily-morning-nowcast.yml",
    tomorrow: "https://github.com/rafaelsantanna13/agua-ta-clara/actions/workflows/daily-tomorrow-forecast.yml",
  };

  function validateWorkerUrl(raw) {
    if (typeof raw !== "string" || !raw.trim()) return null;
    try {
      const url = new URL(raw.trim());
      const host = url.hostname.toLowerCase();
      if (url.protocol !== "https:" || !host.endsWith(".workers.dev") ||
          host === "workers.dev" || url.port || url.username || url.password ||
          (url.pathname !== "/" && url.pathname !== "") ||
          url.search || url.hash) return null;
      return url.origin;
    } catch {
      return null;
    }
  }

  function get(id) {
    return document.getElementById(id);
  }

  function applyWorkerUrl(value) {
    const origin = validateWorkerUrl(value);
    const status = get("adminMode");
    const today = get("updateToday");
    const tomorrow = get("updateTomorrow");
    if (!status || !today || !tomorrow) return;

    if (origin) {
      today.href = origin + "/?kind=morning_nowcast";
      tomorrow.href = origin + "/?kind=tomorrow_forecast";
      today.target = "_self";
      tomorrow.target = "_self";
      today.rel = "noreferrer";
      tomorrow.rel = "noreferrer";
      today.title = "Abrir central Cloudflare protegida e confirmar a execução de hoje";
      tomorrow.title = "Abrir central Cloudflare protegida e confirmar a previsão de amanhã";
      status.textContent = "✓ Acesso direto protegido configurado. Confirme o disparo na próxima tela.";
      status.className = "admin-status ready";
    } else {
      today.href = GITHUB_ACTIONS.today;
      tomorrow.href = GITHUB_ACTIONS.tomorrow;
      today.target = "_blank";
      tomorrow.target = "_blank";
      today.rel = "noopener noreferrer";
      tomorrow.rel = "noopener noreferrer";
      today.title = "Abre GitHub Actions: modo de reserva enquanto o Cloudflare não estiver configurado";
      tomorrow.title = "Abre GitHub Actions: modo de reserva enquanto o Cloudflare não estiver configurado";
      status.textContent = "Acesso direto ainda não configurado; os botões continuam abrindo o GitHub.";
      status.className = "admin-status pending";
    }
  }

  function storedWorkerUrl() {
    try { return window.localStorage.getItem(LOCAL_KEY); } catch { return null; }
  }

  async function init() {
    let origin = validateWorkerUrl(storedWorkerUrl());
    if (!origin) {
      try {
        const response = await fetch("admin-config.json?v=" + Date.now(), { cache: "no-store" });
        if (response.ok) {
          const cfg = await response.json();
          origin = validateWorkerUrl(cfg.worker_url);
        }
      } catch {
        // Static config/network unavailable: retain working GitHub Actions fallback.
      }
    }
    applyWorkerUrl(origin);
    const field = get("workerUrl");
    if (field && origin) field.value = origin;

    const save = get("saveWorkerUrl");
    if (!save) return;
    save.addEventListener("click", function () {
      const value = field ? field.value.trim() : "";
      const validated = validateWorkerUrl(value);
      const message = get("workerSaveResult");
      if (value && !validated) {
        if (message) {
          message.textContent = "Use apenas o endereço HTTPS principal do seu Worker (terminando em .workers.dev), sem caminho ou parâmetros.";
          message.className = "admin-status warning";
        }
        return;
      }
      try {
        if (validated) window.localStorage.setItem(LOCAL_KEY, validated);
        else window.localStorage.removeItem(LOCAL_KEY);
      } catch {
        if (message) {
          message.textContent = "O navegador bloqueou o salvamento local. Use admin-config.json no repositório público.";
          message.className = "admin-status warning";
        }
        return;
      }
      applyWorkerUrl(validated);
      if (message) {
        message.textContent = validated
          ? "✓ Endereço salvo somente neste navegador. Nenhum token foi armazenado."
          : "Endereço local apagado. Se existir uma configuração global, recarregue para utilizá-la.";
        message.className = "admin-status";
      }
    });
  }

  // Pure validator is exposed for our automated browser-independent tests.
  window.ATCAdmin = Object.freeze({ validateWorkerUrl });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
