import { pool } from "../db/database.js";
import { toSqlDatetime } from "./datetime.js";

export async function writeLog({ type = "general", message, po = null, conn = pool }) {
  await conn.query(
    `INSERT INTO LOG (
      datetime, message, type, po_id, po_amount, po_message, po_datetime,
      ob_id, oa_id, ob_code, ob_datetime, cb_code, cb_datetime,
      bb_id, ba_id, bb_code, bb_datetime
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      toSqlDatetime(), message, type,
      po?.po_id ?? null, po?.po_amount ?? null, po?.po_message ?? null, po?.po_datetime ?? null,
      po?.ob_id ?? null, po?.oa_id ?? null, po?.ob_code ?? null, po?.ob_datetime ?? null,
      po?.cb_code ?? null, po?.cb_datetime ?? null,
      po?.bb_id ?? null, po?.ba_id ?? null, po?.bb_code ?? null, po?.bb_datetime ?? null
    ]
  );
}
