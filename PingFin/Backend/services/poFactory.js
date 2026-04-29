import { pool } from "../db/database.js";
import { BANK, OTHER_BANK } from "./config.js";
import { toSqlDatetime } from "./datetime.js";
import { normalizeAmount } from "./validators.js";

function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function generatePoId(index = 1) {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");
  const timePart = now.toISOString().slice(11, 19).replaceAll(":", "");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${BANK.bic}_${datePart}${timePart}_${String(index).padStart(3, "0")}_${random}`.slice(0, 50);
}

export function buildPo(input, index = 1) {
  return {
    po_id: input.po_id || generatePoId(index),
    po_amount: normalizeAmount(input.po_amount),
    po_message: input.po_message || "Manual payment order",
    po_datetime: input.po_datetime || toSqlDatetime(),
    ob_id: input.ob_id || BANK.bic,
    oa_id: input.oa_id,
    ob_code: input.ob_code ?? null,
    ob_datetime: input.ob_datetime ?? null,
    cb_code: input.cb_code ?? null,
    cb_datetime: input.cb_datetime ?? null,
    bb_id: input.bb_id,
    ba_id: input.ba_id,
    bb_code: input.bb_code ?? null,
    bb_datetime: input.bb_datetime ?? null,
    ack_status: input.ack_status,
    error_code: input.error_code,
    error_description: input.error_description
  };
}

export async function generateRandomPaymentOrders(count = 10) {
  const [accountRows] = await pool.query("SELECT id FROM ACCOUNTS ORDER BY id");
  const accounts = accountRows.map((row) => row.id);
  if (accounts.length < 2) throw new Error("Not enough accounts available.");
  const result = [];
  for (let i = 1; i <= count; i++) {
    const type = Math.floor(Math.random() * 5) + 1;
    let oa_id = randomFromArray(accounts);
    let ba_id = randomFromArray(accounts.filter((id) => id !== oa_id));
    let bb_id = OTHER_BANK.bic;
    let message = "Random external payment";
    if (type === 2) { bb_id = BANK.bic; message = "Random internal payment"; }
    if (type === 3) { oa_id = "BE00000000000000"; message = "Random UC1 unknown OA"; }
    if (type === 4) { ba_id = "BE00000000000000"; message = "Random UC4 unknown BA"; }
    if (type === 5) { bb_id = "XXXXBE99"; message = "Random UC3 unknown BB"; }
    result.push(buildPo({
      po_id: generatePoId(i),
      po_amount: Number((Math.random() * 499 + 1).toFixed(2)),
      po_message: message,
      oa_id,
      bb_id,
      ba_id
    }, i));
  }
  return result;
}
