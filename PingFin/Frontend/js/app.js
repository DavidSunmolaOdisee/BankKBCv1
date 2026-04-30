const DEFAULT_API_BASE = window.location.origin;

const BANK_BIC = "BARCBEBB"; // Barclays BIC
const OTHER_BANK_BIC = "DEGRBEBB";

const endpoints = {
  accounts: { path: "/api/accounts/", target: "accountsTable", label: "Accounts" },
  po_new: { path: "/api/po_new/", target: "obTable", label: "PO_NEW" },
  po_out: { path: "/api/po_out/", target: "obTable", label: "PO_OUT" },
  po_in: { path: "/api/po_in/", target: "bbTable", label: "PO_IN" },
  ack_in: { path: "/api/ack_in/", target: "obTable", label: "ACK_IN" },
  ack_out: { path: "/api/ack_out/", target: "bbTable", label: "ACK_OUT" },
  transactions: { path: "/api/transactions/", target: "transactionsTable", label: "Transactions" },
  logs: { path: "/api/logs/", target: "logsTable", label: "Logs" },
  outstanding: { path: "/api/outstanding/", target: "outstandingTable", label: "Outstanding" },
  failed: { path: "/api/failed/", target: "failedTable", label: "Failed" },
  cb_banks: { path: "/api/cb/banks/", target: "cbTable", label: "CB Banks" },
  cb_logs: { path: "/api/cb/logs/", target: "cbTable", label: "CB Logs" }
};

const docs = [
  ["/api/help/", "GET", "Geen tabel", "Overzicht van API endpoints"],
  ["/api/info/", "GET", "Config", "Banknaam, BIC en teaminfo"],
  ["/api/db_check/", "GET", "Database", "Test MySQL connectie"],
  ["/api/accounts/", "GET", "ACCOUNTS", "Alle accounts ophalen"],
  ["/api/accounts/:iban", "GET", "ACCOUNTS", "Één account ophalen"],
  ["/api/po_new/", "GET", "PO_NEW", "Nieuwe PO's bekijken"],
  ["/api/po_new_add/", "POST", "PO_NEW + LOG", "Nieuwe PO toevoegen"],
  ["/api/po_new_generate/?count=10", "GET", "PO_NEW + LOG", "Random test PO's maken"],
  ["/api/po_new_process/", "GET", "PO_NEW, PO_OUT, ACCOUNTS, TRANSACTIONS, LOG", "OB-verwerking"],
  ["/api/po_out/", "GET", "PO_OUT", "Externe PO's richting CB"],
  ["/api/ack_in/", "GET", "ACK_IN", "Ontvangen ACK's bekijken"],
  ["/api/ack_in_add/", "POST", "ACK_IN, ACCOUNTS, TRANSACTIONS, LOG", "ACK van CB verwerken"],
  ["/api/po_in/", "GET", "PO_IN", "Inkomende PO's bekijken"],
  ["/api/po_in_add/", "POST", "PO_IN + LOG", "PO van CB ontvangen"],
  ["/api/po_in_process/", "GET", "PO_IN, ACK_OUT, ACCOUNTS, TRANSACTIONS, LOG", "BB-verwerking"],
  ["/api/ack_out/", "GET", "ACK_OUT", "ACK's richting CB bekijken"],
  ["/api/outstanding/", "GET", "v_outstanding_payments", "PO_OUT zonder ACK_IN"],
  ["/api/failed/", "GET", "v_failed_payments", "Gefaalde betalingen"],
  ["/api/logs/", "GET", "LOG", "Audit trail"],
  ["/api/transactions/", "GET", "TRANSACTIONS", "Alle transacties"],
  ["/api/cb/token/", "GET", "Steven CB", "Token aanvragen en connectie testen"],
  ["/api/cb/banks/", "GET", "Steven CB", "Bankenlijst ophalen"],
  ["/api/cb/send-po-out/", "POST", "PO_OUT + Steven CB", "Lokale PO_OUT naar Steven /po_in sturen"],
  ["/api/cb/fetch-po-in/?test=true", "GET", "Steven CB + PO_IN", "PO_OUT van Steven ophalen en opslaan als PO_IN"],
  ["/api/cb/send-ack-out/", "POST", "ACK_OUT + Steven CB", "Lokale ACK_OUT naar Steven /ack_in sturen"],
  ["/api/cb/fetch-ack-in/?test=true", "GET", "Steven CB + ACK_IN", "ACK_OUT van Steven ophalen en opslaan als ACK_IN"]
];

const scenarios = [
  {
    id: "uc1",
    title: "UC1 - OB validation fails",
    description: "OA bestaat niet. Verwacht: PO_NEW status FAILED, geen PO_OUT.",
    action: "po_new",
    payload: {
      po_id: makePoId("UC1"),
      po_amount: 120,
      po_message: "UC1 unknown OA",
      oa_id: "BE00000000000000",
      bb_id: OTHER_BANK_BIC,
      ba_id: "BE37096123456702"
    }
  },
  {
    id: "uc2",
    title: "UC2 - Internal payment",
    description: "OA en BA zitten bij Bank KBC/BARCBEBB. Verwacht: debit OA, credit BA, geen PO_OUT.",
    action: "po_new",
    payload: {
      po_id: makePoId("UC2"),
      po_amount: 50,
      po_message: "UC2 internal payment",
      oa_id: "BE64096123456701",
      bb_id: BANK_BIC,
      ba_id: "BE37096123456702"
    }
  },
  {
    id: "uc3",
    title: "UC3 - CB validation fails",
    description: "BB is onbekend. Eerst komt PO in PO_OUT, daarna kan je een FAILED ACK_IN simuleren.",
    action: "po_new",
    payload: {
      po_id: makePoId("UC3"),
      po_amount: 75,
      po_message: "UC3 unknown BB",
      oa_id: "BE10096123456703",
      bb_id: "XXXXBE99",
      ba_id: "BE37096123456702"
    }
  },
  {
    id: "uc4",
    title: "UC4 - BB validation fails",
    description: "BA bestaat niet bij onze bank als BB. Verwacht: ACK_OUT FAILED.",
    action: "po_in",
    payload: {
      po_id: makePoId("UC4IN", OTHER_BANK_BIC),
      po_amount: 100,
      po_message: "UC4 incoming unknown BA",
      ob_id: OTHER_BANK_BIC,
      oa_id: "BE42096123456709",
      ob_code: "2000",
      cb_code: "2000",
      bb_id: BANK_BIC,
      ba_id: "BE00000000000000"
    }
  },
  {
    id: "uc5-ob",
    title: "UC5 - External payment as OB",
    description: "Correcte externe betaling. Verwacht: PO_OUT, daarna ACK_IN SUCCESS simuleren.",
    action: "po_new",
    payload: {
      po_id: makePoId("UC5"),
      po_amount: 125,
      po_message: "UC5 external success",
      oa_id: "BE26096123456706",
      bb_id: OTHER_BANK_BIC,
      ba_id: "BE96096123456707"
    }
  },
  {
    id: "uc5-bb",
    title: "UC5 - Incoming payment as BB",
    description: "Correcte inkomende betaling. Verwacht: BA credit en ACK_OUT SUCCESS.",
    action: "po_in",
    payload: {
      po_id: makePoId("UC5IN", OTHER_BANK_BIC),
      po_amount: 90,
      po_message: "UC5 incoming success",
      ob_id: OTHER_BANK_BIC,
      oa_id: "BE42096123456709",
      ob_code: "2000",
      cb_code: "2000",
      bb_id: BANK_BIC,
      ba_id: "BE15096123456710"
    }
  }
];

function makePoId(tag, bic = BANK_BIC) {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `${bic}_${tag}_${stamp}`.slice(0, 50);
}

function getApiBase() {
  return localStorage.getItem("pingfinApiBase") || DEFAULT_API_BASE;
}

function setApiBase(value) {
  localStorage.setItem("pingfinApiBase", value.replace(/\/$/, ""));
}

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function showToast(message, type = "success") {
  const toast = qs("#toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  setTimeout(() => toast.classList.add("hidden"), 4500);
}

async function apiFetch(path, options = {}) {
  const url = `${getApiBase()}${path}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Geen geldige JSON van ${url}: ${text.slice(0, 200)}`);
  }
  if (!response.ok || json?.ok === false) {
    throw new Error(json?.message || `Request failed: ${response.status}`);
  }
  return json;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderJson(targetId, value) {
  const target = qs(`#${targetId}`);
  target.innerHTML = `<pre class="json-output">${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
}

function renderTable(targetId, rows, title = "Data") {
  const target = qs(`#${targetId}`);
  const data = Array.isArray(rows) ? rows : rows ? [rows] : [];
  if (!data.length) {
    target.innerHTML = `<div class="empty-state">Geen rijen gevonden voor ${escapeHtml(title)}.</div>`;
    return;
  }

  const keys = Array.from(data.reduce((set, row) => {
    Object.keys(row || {}).forEach(key => set.add(key));
    return set;
  }, new Set()));

  const header = keys.map(key => `<th>${escapeHtml(key)}</th>`).join("");
  const body = data.map(row => `
    <tr>
      ${keys.map(key => `<td>${formatCell(row?.[key])}</td>`).join("")}
    </tr>
  `).join("");

  target.innerHTML = `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
}

function formatCell(value) {
  if (value === null || value === undefined) return "<span class='muted'>NULL</span>";
  if (typeof value === "object") return `<code>${escapeHtml(JSON.stringify(value))}</code>`;
  const text = String(value);
  if (/^BE\d+/.test(text) || /^[A-Z0-9]{8,11}$/.test(text) || text.includes("_")) return `<code>${escapeHtml(text)}</code>`;
  return escapeHtml(text);
}

function formToObject(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  Object.keys(data).forEach(key => {
    if (data[key] === "") delete data[key];
  });
  if (data.po_amount !== undefined) data.po_amount = Number(data.po_amount);
  return data;
}

async function loadEndpoint(key) {
  const endpoint = endpoints[key];
  if (!endpoint) return;
  const json = await apiFetch(endpoint.path);
  renderTable(endpoint.target, json.data, endpoint.label);
  showToast(`${endpoint.label} geladen.`);
  return json.data;
}

async function testConnection() {
  const status = qs("#connectionStatus");
  try {
    const json = await apiFetch("/api/db_check/");
    status.textContent = json.data?.success ? "API + database OK" : "API bereikbaar, database niet OK";
    status.style.color = json.data?.success ? "#86efac" : "#fca5a5";
    showToast(json.message, json.data?.success ? "success" : "error");
  } catch (err) {
    status.textContent = err.message;
    status.style.color = "#fca5a5";
    showToast(err.message, "error");
  }
}

async function loadDashboard() {
  try {
    const [accounts, poNew, poOut, outstanding, failed, logs] = await Promise.all([
      apiFetch("/api/accounts/").then(r => r.data).catch(() => []),
      apiFetch("/api/po_new/").then(r => r.data).catch(() => []),
      apiFetch("/api/po_out/").then(r => r.data).catch(() => []),
      apiFetch("/api/outstanding/").then(r => r.data).catch(() => []),
      apiFetch("/api/failed/").then(r => r.data).catch(() => []),
      apiFetch("/api/logs/").then(r => r.data).catch(() => [])
    ]);

    qs("#statAccounts").textContent = accounts.length;
    qs("#statPoNew").textContent = poNew.length;
    qs("#statPoOut").textContent = poOut.length;
    qs("#statOutstanding").textContent = outstanding.length;
    qs("#statFailed").textContent = failed.length;

    const latest = logs.slice(0, 6).map(log => `
      <div class="mini-item">
        <strong>${escapeHtml(log.type || "log")} · ${escapeHtml(log.po_id || "-")}</strong>
        <span>${escapeHtml(log.datetime || "")} — ${escapeHtml(log.message || "")}</span>
      </div>
    `).join("");
    qs("#latestLogs").innerHTML = latest || "<div class='empty-state'>Nog geen logs.</div>";
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function postList(path, item) {
  return apiFetch(path, {
    method: "POST",
    body: JSON.stringify({ data: [item] })
  });
}

async function handleFormSubmit(event, path, successMessage, after) {
  event.preventDefault();
  try {
    const item = formToObject(event.currentTarget);
    const json = await postList(path, item);
    showToast(successMessage || json.message);
    if (after) await after(json);
  } catch (err) {
    showToast(err.message, "error");
  }
}

function setupNavigation() {
  qsa(".nav-btn").forEach(button => {
    button.addEventListener("click", () => {
      qsa(".nav-btn").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      qsa(".page").forEach(page => page.classList.remove("active-page"));
      qs(`#${button.dataset.page}`).classList.add("active-page");
      qs("#pageTitle").textContent = button.textContent;
      refreshCurrentPage();
    });
  });
}

function currentPageId() {
  return qs(".page.active-page")?.id || "dashboard";
}

async function refreshCurrentPage() {
  const page = currentPageId();
  if (page === "dashboard") await loadDashboard();
  if (page === "accounts") await loadEndpoint("accounts").catch(err => showToast(err.message, "error"));
  if (page === "monitoring") {
    await Promise.allSettled([loadEndpoint("transactions"), loadEndpoint("logs"), loadEndpoint("outstanding"), loadEndpoint("failed")]);
  }
  if (page === "cb-flow") {
    await loadEndpoint("cb_banks").catch(err => showToast(err.message, "error"));
  }
}

function setupButtons() {
  qs("#apiBase").value = getApiBase();
  qs("#saveApiBase").addEventListener("click", () => {
    setApiBase(qs("#apiBase").value);
    showToast("API base URL opgeslagen.");
  });
  qs("#testConnection").addEventListener("click", testConnection);
  qs("#refreshCurrent").addEventListener("click", refreshCurrentPage);

  qsa("[data-load]").forEach(button => {
    button.addEventListener("click", async () => {
      try { await loadEndpoint(button.dataset.load); }
      catch (err) { showToast(err.message, "error"); }
    });
  });

  qsa("[data-process]").forEach(button => {
    button.addEventListener("click", async () => {
      try {
        const key = button.dataset.process;
        const path = key === "po_new" ? "/api/po_new_process/" : "/api/po_in_process/";
        const json = await apiFetch(path);
        showToast(json.message);
        if (key === "po_new") await loadEndpoint("po_new");
        if (key === "po_in") await loadEndpoint("po_in");
        await loadDashboard();
      } catch (err) { showToast(err.message, "error"); }
    });
  });

  qsa("[data-action]").forEach(button => {
    button.addEventListener("click", async () => {
      try {
        const action = button.dataset.action;
        if (action === "generate10") await apiFetch("/api/po_new_generate/?count=10");
        if (action === "processPoNew") await apiFetch("/api/po_new_process/");
        if (action === "processPoIn") await apiFetch("/api/po_in_process/");
        if (action === "loadOutstanding") switchPage("monitoring", "outstanding");
        if (action === "loadFailed") switchPage("monitoring", "failed");
        if (action === "cbToken") {
          const json = await apiFetch("/api/cb/token/?force=true");
          switchPage("cb-flow");
          renderJson("cbTable", json.data);
        }
        if (action === "cbBanks") {
          switchPage("cb-flow");
          await loadEndpoint("cb_banks");
        }
        if (action === "cbSendPoOut") {
          const json = await apiFetch("/api/cb/send-po-out/", { method: "POST", body: JSON.stringify({}) });
          switchPage("cb-flow");
          renderJson("cbTable", json.data);
        }
        if (action === "cbFetchPoInTest") {
          const json = await apiFetch("/api/cb/fetch-po-in/?test=true");
          switchPage("cb-flow");
          renderJson("cbTable", json.data);
        }
        if (action === "cbFetchPoInReal") {
          const json = await apiFetch("/api/cb/fetch-po-in/?test=false");
          switchPage("cb-flow");
          renderJson("cbTable", json.data);
        }
        if (action === "cbSendAckOut") {
          const json = await apiFetch("/api/cb/send-ack-out/", { method: "POST", body: JSON.stringify({}) });
          switchPage("cb-flow");
          renderJson("cbTable", json.data);
        }
        if (action === "cbFetchAckInTest") {
          const json = await apiFetch("/api/cb/fetch-ack-in/?test=true");
          switchPage("cb-flow");
          renderJson("cbTable", json.data);
        }
        if (action === "cbFetchAckInReal") {
          const json = await apiFetch("/api/cb/fetch-ack-in/?test=false");
          switchPage("cb-flow");
          renderJson("cbTable", json.data);
        }
        showToast("Actie uitgevoerd.");
        await loadDashboard();
      } catch (err) { showToast(err.message, "error"); }
    });
  });
}

function switchPage(pageId, loadKey) {
  qsa(".nav-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.page === pageId));
  qsa(".page").forEach(page => page.classList.toggle("active-page", page.id === pageId));
  qs("#pageTitle").textContent = qsa(".nav-btn").find(btn => btn.dataset.page === pageId)?.textContent || pageId;
  if (loadKey) loadEndpoint(loadKey).catch(err => showToast(err.message, "error"));
}

function setupForms() {
  qs("#poNewForm").addEventListener("submit", event => handleFormSubmit(event, "/api/po_new_add/", "PO toegevoegd aan PO_NEW.", () => loadEndpoint("po_new")));
  qs("#generateForm").addEventListener("submit", async event => {
    event.preventDefault();
    try {
      const count = Number(new FormData(event.currentTarget).get("count") || 10);
      const json = await apiFetch(`/api/po_new_generate/?count=${encodeURIComponent(count)}`);
      showToast(json.message);
      await loadEndpoint("po_new");
      await loadDashboard();
    } catch (err) { showToast(err.message, "error"); }
  });
  qs("#ackInForm").addEventListener("submit", event => handleFormSubmit(event, "/api/ack_in_add/", "ACK_IN toegevoegd/verwerkt.", () => loadEndpoint("ack_in")));
  qs("#poInForm").addEventListener("submit", event => handleFormSubmit(event, "/api/po_in_add/", "PO toegevoegd aan PO_IN.", () => loadEndpoint("po_in")));
}

function renderScenarios() {
  const container = qs("#scenarioCards");
  container.innerHTML = scenarios.map((scenario, index) => `
    <article class="scenario-card">
      <h4>${escapeHtml(scenario.title)}</h4>
      <p>${escapeHtml(scenario.description)}</p>
      <code>${escapeHtml(JSON.stringify(scenario.payload, null, 2))}</code>
      <div class="button-row">
        <button class="small-btn" data-copy-scenario="${index}">Kopieer JSON</button>
        <button class="primary-btn" data-run-scenario="${index}">Maak testdata</button>
      </div>
    </article>
  `).join("");

  qsa("[data-copy-scenario]").forEach(button => {
    button.addEventListener("click", async () => {
      const scenario = scenarios[Number(button.dataset.copyScenario)];
      await navigator.clipboard.writeText(JSON.stringify({ data: [scenario.payload] }, null, 2));
      showToast("JSON gekopieerd.");
    });
  });

  qsa("[data-run-scenario]").forEach(button => {
    button.addEventListener("click", async () => {
      try {
        const scenario = scenarios[Number(button.dataset.runScenario)];
        const path = scenario.action === "po_in" ? "/api/po_in_add/" : "/api/po_new_add/";
        await postList(path, scenario.payload);
        showToast(`${scenario.title} aangemaakt.`);
        await loadDashboard();
      } catch (err) { showToast(err.message, "error"); }
    });
  });
}

function renderDocs() {
  qs("#docsList").innerHTML = docs.map(([path, method, layer, description]) => `
    <div class="docs-row">
      <strong>${escapeHtml(path)}</strong>
      <span>${escapeHtml(method)}</span>
      <span>${escapeHtml(layer)}</span>
      <span>${escapeHtml(description)}</span>
    </div>
  `).join("");
}

function init() {
  setupNavigation();
  setupButtons();
  setupForms();
  renderScenarios();
  renderDocs();
  loadDashboard();
}

init();
