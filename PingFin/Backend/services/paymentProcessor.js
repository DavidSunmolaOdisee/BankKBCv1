import { pool } from "../db/database.js";
import { accountExists } from "../db/accounts.js";
import { poInsertColumns, poInsertPlaceholders, poValues } from "../db/paymentOrders.js";
import { BANK, CODES } from "./config.js";
import { toSqlDatetime } from "./datetime.js";
import { validateAmount, isValidBic } from "./validators.js";
import { writeLog } from "./logger.js";

async function insertTransaction(conn, { amount, po_id, account_id, isvalid, iscomplete, description }) {
  await conn.query(
    `INSERT INTO TRANSACTIONS (amount, datetime, po_id, account_id, isvalid, iscomplete, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [amount, toSqlDatetime(), po_id, account_id, isvalid ? 1 : 0, iscomplete ? 1 : 0, description]
  );
}

async function markPoNewFailed(conn, po, code, description, accountId = null) {
  const now = toSqlDatetime();
  await conn.query(
    `UPDATE PO_NEW
     SET status = 'FAILED', error_code = ?, error_description = ?, ob_code = ?, ob_datetime = ?
     WHERE po_id = ?`,
    [code, description, code, now, po.po_id]
  );
  await insertTransaction(conn, {
    amount: 0,
    po_id: po.po_id,
    account_id: accountId,
    isvalid: false,
    iscomplete: true,
    description
  });
  await writeLog({ type: "validation_failed", message: description, po: { ...po, ob_code: code, ob_datetime: now }, conn });
  return { po_id: po.po_id, status: "FAILED", code, message: description };
}

async function validateOb(conn, po) {
  const amountValidation = validateAmount(po.po_amount);
  if (!amountValidation.valid) return amountValidation;
  if (po.ob_id !== BANK.bic) return { valid: false, code: "OB_WRONG_BANK", message: `This PO belongs to ${po.ob_id}, not ${BANK.bic}.` };
  if (!isValidBic(po.bb_id)) return { valid: false, code: CODES.INVALID_BIC, message: "bb_id is not a valid BIC." };
  const oa = await accountExists(po.oa_id, conn);
  if (!oa) return { valid: false, code: CODES.UNKNOWN_OA, message: "Originator account does not exist." };
  if (Number(oa.balance) < Number(po.po_amount)) return { valid: false, code: CODES.INSUFFICIENT_FUNDS, message: "Originator account has insufficient funds.", accountId: po.oa_id };
  if (po.bb_id === BANK.bic) {
    const ba = await accountExists(po.ba_id, conn);
    if (!ba) return { valid: false, code: CODES.UNKNOWN_BA, message: "Beneficiary account does not exist for internal payment.", accountId: po.oa_id };
  }
  return { valid: true, code: CODES.OK, message: "OB validation passed." };
}

export async function addPoNewList(list) {
  const inserted = [];
  const skipped = [];
  for (const po of list) {
    try {
      await pool.query(
        `INSERT INTO PO_NEW (${poInsertColumns()}, status)
         VALUES (${poInsertPlaceholders()}, 'NEW')`,
        poValues(po)
      );
      await writeLog({ type: "po_new_add", message: `PO added to PO_NEW: ${po.po_id}`, po });
      inserted.push(po);
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") skipped.push({ po_id: po.po_id, code: CODES.DUPLICATE_PO, message: "Duplicate po_id." });
      else throw err;
    }
  }
  return { inserted, skipped };
}

export async function processPoNew() {
  const [rows] = await pool.query("SELECT * FROM PO_NEW WHERE status = 'NEW' ORDER BY po_datetime ASC");
  const results = [];
  for (const po of rows) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [lockedRows] = await conn.query("SELECT * FROM PO_NEW WHERE po_id = ? FOR UPDATE", [po.po_id]);
      const lockedPo = lockedRows[0];
      if (!lockedPo || lockedPo.status !== "NEW") { await conn.rollback(); continue; }
      const validation = await validateOb(conn, lockedPo);
      if (!validation.valid) {
        const failed = await markPoNewFailed(conn, lockedPo, validation.code, validation.message, validation.accountId ?? null);
        await conn.commit();
        results.push(failed);
        continue;
      }
      const now = toSqlDatetime();
      if (lockedPo.bb_id === BANK.bic) {
        await conn.query("UPDATE ACCOUNTS SET balance = balance - ? WHERE id = ?", [lockedPo.po_amount, lockedPo.oa_id]);
        await conn.query("UPDATE ACCOUNTS SET balance = balance + ? WHERE id = ?", [lockedPo.po_amount, lockedPo.ba_id]);
        await insertTransaction(conn, { amount: -Number(lockedPo.po_amount), po_id: lockedPo.po_id, account_id: lockedPo.oa_id, isvalid: true, iscomplete: true, description: "Internal payment debit OA" });
        await insertTransaction(conn, { amount: Number(lockedPo.po_amount), po_id: lockedPo.po_id, account_id: lockedPo.ba_id, isvalid: true, iscomplete: true, description: "Internal payment credit BA" });
        await conn.query("UPDATE PO_NEW SET status = 'PROCESSED_INTERNAL', ob_code = ?, ob_datetime = ? WHERE po_id = ?", [CODES.OK, now, lockedPo.po_id]);
        await writeLog({ type: "internal_payment", message: `Internal payment processed: ${lockedPo.po_id}`, po: { ...lockedPo, ob_code: CODES.OK, ob_datetime: now }, conn });
        await conn.commit();
        results.push({ po_id: lockedPo.po_id, status: "PROCESSED_INTERNAL", code: CODES.OK, message: "Internal payment processed." });
        continue;
      }
      const poOut = { ...lockedPo, ob_code: CODES.OK, ob_datetime: now };
      await conn.query(
        `INSERT IGNORE INTO PO_OUT (${poInsertColumns()}, status, sent_at)
         VALUES (${poInsertPlaceholders()}, 'READY_TO_SEND', NULL)`,
        poValues(poOut)
      );
      await conn.query("UPDATE PO_NEW SET status = 'SENT_TO_CB', ob_code = ?, ob_datetime = ? WHERE po_id = ?", [CODES.OK, now, lockedPo.po_id]);
      await writeLog({ type: "po_out", message: `External PO moved to PO_OUT: ${lockedPo.po_id}`, po: poOut, conn });
      await conn.commit();
      results.push({ po_id: lockedPo.po_id, status: "SENT_TO_CB", code: CODES.OK, message: "External payment moved to PO_OUT." });
    } catch (err) {
      await conn.rollback();
      results.push({ po_id: po.po_id, status: "ERROR", code: "PROCESS_ERROR", message: err.message });
    } finally {
      conn.release();
    }
  }
  return results;
}

async function ackAlreadyProcessed(conn, poId, descriptionPrefix) {
  const [rows] = await conn.query("SELECT id FROM TRANSACTIONS WHERE po_id = ? AND description LIKE ? LIMIT 1", [poId, `${descriptionPrefix}%`]);
  return rows.length > 0;
}

export async function addAckInList(list) {
  const results = [];
  for (const ack of list) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const ackStatus = ack.ack_status || ((ack.cb_code === CODES.OK && ack.bb_code === CODES.OK) ? "SUCCESS" : "FAILED");
      const errorCode = ack.error_code || (ackStatus === "SUCCESS" ? null : (ack.bb_code && ack.bb_code !== CODES.OK ? ack.bb_code : ack.cb_code));
      const errorDescription = ack.error_description || (ackStatus === "SUCCESS" ? null : "Negative acknowledgement received.");
      await conn.query(
        `INSERT INTO ACK_IN (${poInsertColumns()}, ack_status, error_code, error_description, received_at)
         VALUES (${poInsertPlaceholders()}, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE ack_status = VALUES(ack_status), error_code = VALUES(error_code), error_description = VALUES(error_description), received_at = VALUES(received_at), cb_code = VALUES(cb_code), cb_datetime = VALUES(cb_datetime), bb_code = VALUES(bb_code), bb_datetime = VALUES(bb_datetime)`,
        [...poValues(ack), ackStatus, errorCode, errorDescription, toSqlDatetime()]
      );
      if (ackStatus === "SUCCESS") {
        const alreadyProcessed = await ackAlreadyProcessed(conn, ack.po_id, "External payment debit OA after positive ACK");
        if (!alreadyProcessed) {
          const oa = await accountExists(ack.oa_id, conn);
          if (oa && Number(oa.balance) >= Number(ack.po_amount)) {
            await conn.query("UPDATE ACCOUNTS SET balance = balance - ? WHERE id = ?", [ack.po_amount, ack.oa_id]);
            await insertTransaction(conn, { amount: -Number(ack.po_amount), po_id: ack.po_id, account_id: ack.oa_id, isvalid: true, iscomplete: true, description: "External payment debit OA after positive ACK" });
          }
        }
      } else {
        const alreadyProcessed = await ackAlreadyProcessed(conn, ack.po_id, "External payment failed after ACK");
        if (!alreadyProcessed) await insertTransaction(conn, { amount: 0, po_id: ack.po_id, account_id: ack.oa_id || null, isvalid: false, iscomplete: true, description: `External payment failed after ACK: ${errorDescription}` });
      }
      await writeLog({ type: "ack_in", message: `ACK_IN received: ${ack.po_id} status=${ackStatus}`, po: ack, conn });
      await conn.commit();
      results.push({ po_id: ack.po_id, ack_status: ackStatus, code: errorCode || CODES.OK, message: ackStatus === "SUCCESS" ? "ACK processed successfully." : errorDescription });
    } catch (err) {
      await conn.rollback();
      results.push({ po_id: ack.po_id, ack_status: "ERROR", code: "ACK_IN_ERROR", message: err.message });
    } finally {
      conn.release();
    }
  }
  return results;
}

export async function addPoInList(list) {
  const results = [];
  for (const po of list) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        `INSERT INTO PO_IN (${poInsertColumns()}, status, received_at)
         VALUES (${poInsertPlaceholders()}, 'RECEIVED', ?)
         ON DUPLICATE KEY UPDATE received_at = VALUES(received_at)`,
        [...poValues(po), toSqlDatetime()]
      );
      await writeLog({ type: "po_in", message: `PO_IN received: ${po.po_id}`, po, conn });
      await conn.commit();
      results.push({ po_id: po.po_id, status: "RECEIVED", code: CODES.OK, message: "PO_IN received." });
    } catch (err) {
      await conn.rollback();
      results.push({ po_id: po.po_id, status: "ERROR", code: "PO_IN_ERROR", message: err.message });
    } finally {
      conn.release();
    }
  }
  return results;
}

export async function processPoIn() {
  const [rows] = await pool.query("SELECT * FROM PO_IN WHERE status = 'RECEIVED' ORDER BY po_datetime ASC");
  const results = [];
  for (const po of rows) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const now = toSqlDatetime();
      let ackStatus = "SUCCESS";
      let code = CODES.OK;
      let description = "Incoming payment processed.";
      const amountValidation = validateAmount(po.po_amount);
      const ba = await accountExists(po.ba_id, conn);
      if (po.bb_id !== BANK.bic) { ackStatus = "FAILED"; code = "BB_WRONG_BANK"; description = `This PO is for ${po.bb_id}, not ${BANK.bic}.`; }
      else if (!amountValidation.valid) { ackStatus = "FAILED"; code = amountValidation.code; description = amountValidation.message; }
      else if (!ba) { ackStatus = "FAILED"; code = CODES.UNKNOWN_BA; description = "Beneficiary account does not exist."; }
      if (ackStatus === "SUCCESS") {
        await conn.query("UPDATE ACCOUNTS SET balance = balance + ? WHERE id = ?", [po.po_amount, po.ba_id]);
        await insertTransaction(conn, { amount: Number(po.po_amount), po_id: po.po_id, account_id: po.ba_id, isvalid: true, iscomplete: true, description: "Incoming external payment credit BA" });
        await conn.query("UPDATE PO_IN SET status = 'PROCESSED', bb_code = ?, bb_datetime = ? WHERE po_id = ?", [CODES.OK, now, po.po_id]);
      } else {
        await insertTransaction(conn, { amount: 0, po_id: po.po_id, account_id: po.ba_id || null, isvalid: false, iscomplete: true, description });
        await conn.query("UPDATE PO_IN SET status = 'FAILED', bb_code = ?, bb_datetime = ? WHERE po_id = ?", [code, now, po.po_id]);
      }
      const ackOut = { ...po, bb_code: code, bb_datetime: now };
      await conn.query(
        `INSERT INTO ACK_OUT (${poInsertColumns()}, ack_status, error_code, error_description, sent_at)
         VALUES (${poInsertPlaceholders()}, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE ack_status = VALUES(ack_status), error_code = VALUES(error_code), error_description = VALUES(error_description), sent_at = VALUES(sent_at), bb_code = VALUES(bb_code), bb_datetime = VALUES(bb_datetime)`,
        [...poValues(ackOut), ackStatus, ackStatus === "SUCCESS" ? null : code, ackStatus === "SUCCESS" ? null : description, now]
      );
      await writeLog({ type: "ack_out", message: `ACK_OUT created: ${po.po_id} status=${ackStatus}`, po: ackOut, conn });
      await conn.commit();
      results.push({ po_id: po.po_id, ack_status: ackStatus, code, message: description });
    } catch (err) {
      await conn.rollback();
      results.push({ po_id: po.po_id, ack_status: "ERROR", code: "PO_IN_PROCESS_ERROR", message: err.message });
    } finally {
      conn.release();
    }
  }
  return results;
}
