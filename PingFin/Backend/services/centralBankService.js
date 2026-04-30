import { pool } from "../db/database.js";
import { addAckInList, addPoInList } from "./paymentProcessor.js";
import { BANK, OTHER_BANK, CB_API_BASE_URL, CODES } from "./config.js";
import { writeLog } from "./logger.js";
import { toSqlDatetime } from "./datetime.js";

const tokenCache = new Map();

function bankConfig(bank = "A") {
  const normalized = String(bank || "A").toUpperCase();
  if (normalized === "B" || normalized === "OTHER") {
    return { key: "B", bic: OTHER_BANK.bic, secretKey: OTHER_BANK.secretKey, name: OTHER_BANK.name };
  }
  return { key: "A", bic: BANK.bic, secretKey: BANK.secretKey, name: BANK.name };
}

function requireSecret(config) {
  if (!config.secretKey) {
    throw new Error(`Missing secret key for bank ${config.key} (${config.bic}). Set TEAM_SECRET_KEY or OTHER_BANK_SECRET_KEY in .env.`);
  }
}

function endpoint(path) {
  return `${CB_API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readJsonResponse(response) {
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`CB returned non-JSON response (${response.status}): ${text.slice(0, 300)}`);
  }
  if (!response.ok || json?.ok === false) {
    throw new Error(json?.message || `CB request failed with HTTP ${response.status}`);
  }
  return json;
}

export async function getCentralBankToken(bank = "A", { forceRefresh = false } = {}) {
  const config = bankConfig(bank);
  requireSecret(config);

  const cached = tokenCache.get(config.key);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return { ...cached, cached: true, bic: config.bic, bank: config.key };
  }

  const response = await fetch(endpoint("/token"), {
    method: "POST",
    body: JSON.stringify({ bic: config.bic, secret_key: config.secretKey })
  });

  const json = await readJsonResponse(response);
  if (!json.token) throw new Error(json.message || "CB did not return a token.");

  const tokenData = {
    token: json.token,
    expiresAt: Date.now() + 3.75 * 60 * 60 * 1000,
    createdAt: new Date().toISOString()
  };

  tokenCache.set(config.key, tokenData);
  return { ...tokenData, cached: false, bic: config.bic, bank: config.key };
}

async function authorizedCbFetch(path, { bank = "A", method = "GET", body = null, forceTokenRefresh = false } = {}) {
  const tokenData = await getCentralBankToken(bank, { forceRefresh: forceTokenRefresh });
  const headers = { Authorization: `Bearer ${tokenData.token}` };
  const options = { method, headers, redirect: "follow" };

  if (body !== null) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint(path), options);
  const json = await readJsonResponse(response);
  return { request: { method, url: endpoint(path), bank: tokenData.bank, bic: tokenData.bic }, response: json };
}

export async function getCentralBankBanks(bank = "A") {
  return authorizedCbFetch("/banks", { bank });
}

export async function updateCentralBankBankInfo({ bank = "A", name = BANK.name, members = BANK.members.join(", ") } = {}) {
  return authorizedCbFetch("/banks", { bank, method: "POST", body: { name, members } });
}

export async function getCentralBankStats(bank = "A") {
  return authorizedCbFetch("/stats/type/log", { bank });
}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

export async function sendPoOutToCentralBank({ bank = "A", poId = null, includeAll = false } = {}) {
  const params = [];
  let where = "";

  if (poId) {
    where = "WHERE po_id = ?";
    params.push(poId);
  } else if (!includeAll) {
    where = "WHERE status IN ('READY_TO_SEND', 'SENT')";
  }

  const [rows] = await pool.query(`SELECT * FROM PO_OUT ${where} ORDER BY po_datetime ASC`, params);
  if (!rows.length) {
    return { sent_count: 0, sent: [], cb: null, message: "No PO_OUT rows ready to send." };
  }

  const poList = rows.map((row) => ({
    po_id: row.po_id,
    po_amount: Number(row.po_amount),
    po_message: row.po_message,
    po_datetime: row.po_datetime,
    ob_id: row.ob_id,
    oa_id: row.oa_id,
    ob_code: row.ob_code || CODES.OK,
    ob_datetime: row.ob_datetime || row.sent_at || row.po_datetime || toSqlDatetime(),
    bb_id: row.bb_id,
    ba_id: row.ba_id
  }));

  const cb = await authorizedCbFetch("/po_in", { bank, method: "POST", body: { data: poList } });
  const now = toSqlDatetime();

  for (const po of poList) {
    await pool.query("UPDATE PO_OUT SET status = 'SENT_TO_CB_API', sent_at = ? WHERE po_id = ?", [now, po.po_id]);
    await writeLog({ type: "cb_po_in", message: `PO_OUT sent to Steven CB: ${po.po_id}`, po });
  }

  return { sent_count: poList.length, sent: poList, cb: cb.response };
}

export async function fetchPoInFromCentralBank({ bank = "A", test = true } = {}) {
  const path = test ? "/po_out/test/true" : "/po_out";
  const cb = await authorizedCbFetch(path, { bank });
  const poList = normalizeList(cb.response.data);

  if (!poList.length) {
    return { received_count: 0, stored: [], cb: cb.response, message: "No incoming PO found at CB." };
  }

  const stored = await addPoInList(poList);
  return { received_count: poList.length, stored, cb: cb.response, test_mode: test };
}

export async function sendAckOutToCentralBank({ bank = "A", poId = null, includeAll = true } = {}) {
  const params = [];
  let where = "";

  if (poId) {
    where = "WHERE po_id = ?";
    params.push(poId);
  } else if (!includeAll) {
    where = "WHERE ack_status IN ('SUCCESS', 'FAILED')";
  }

  const [rows] = await pool.query(`SELECT * FROM ACK_OUT ${where} ORDER BY sent_at ASC`, params);
  if (!rows.length) {
    return { sent_count: 0, sent: [], cb: null, message: "No ACK_OUT rows found." };
  }

  const ackList = rows.map((row) => ({
    po_id: row.po_id,
    po_amount: Number(row.po_amount),
    po_message: row.po_message,
    po_datetime: row.po_datetime,
    ob_id: row.ob_id,
    oa_id: row.oa_id,
    ob_code: row.ob_code,
    ob_datetime: row.ob_datetime,
    cb_code: row.cb_code,
    cb_datetime: row.cb_datetime,
    bb_id: row.bb_id,
    ba_id: row.ba_id,
    bb_code: row.bb_code || (row.ack_status === "SUCCESS" ? CODES.OK : row.error_code),
    bb_datetime: row.bb_datetime || row.sent_at || toSqlDatetime()
  }));

  const cb = await authorizedCbFetch("/ack_in", { bank, method: "POST", body: { data: ackList } });

  for (const ack of ackList) {
    await writeLog({ type: "cb_ack_in", message: `ACK_OUT sent to Steven CB: ${ack.po_id}`, po: ack });
  }

  return { sent_count: ackList.length, sent: ackList, cb: cb.response };
}

export async function fetchAckInFromCentralBank({ bank = "A", test = true } = {}) {
  const path = test ? "/ack_out/test/true" : "/ack_out";
  const cb = await authorizedCbFetch(path, { bank });
  const ackList = normalizeList(cb.response.data);

  if (!ackList.length) {
    return { received_count: 0, stored: [], cb: cb.response, message: "No incoming ACK found at CB." };
  }

  const stored = await addAckInList(ackList);
  return { received_count: ackList.length, stored, cb: cb.response, test_mode: test };
}
