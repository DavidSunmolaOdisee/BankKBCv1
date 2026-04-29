import { pool } from "./database.js";

const PO_FIELDS = [
  "po_id",
  "po_amount",
  "po_message",
  "po_datetime",
  "ob_id",
  "oa_id",
  "ob_code",
  "ob_datetime",
  "cb_code",
  "cb_datetime",
  "bb_id",
  "ba_id",
  "bb_code",
  "bb_datetime"
];

export function poInsertColumns() {
  return PO_FIELDS.map((field) => `\`${field}\``).join(", ");
}

export function poInsertPlaceholders() {
  return PO_FIELDS.map(() => "?").join(", ");
}

export function poValues(po) {
  return PO_FIELDS.map((field) => po[field] ?? null);
}

export async function getTableRows(tableName, orderBy = "po_datetime DESC") {
  const allowed = new Set(["PO_NEW", "PO_OUT", "PO_IN", "ACK_IN", "ACK_OUT", "TRANSACTIONS", "LOG"]);
  if (!allowed.has(tableName)) throw new Error("Invalid table name");
  const [rows] = await pool.query(`SELECT * FROM ${tableName} ORDER BY ${orderBy}`);
  return rows;
}
