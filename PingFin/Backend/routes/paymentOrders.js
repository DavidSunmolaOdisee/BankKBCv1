import { Router } from "express";
import { pool } from "../db/database.js";
import { getTableRows } from "../db/paymentOrders.js";
import { buildPo, generateRandomPaymentOrders } from "../services/poFactory.js";
import { validatePoShape } from "../services/validators.js";
import { sendOk, sendCreated, sendBadRequest } from "../services/response.js";
import { addPoNewList, processPoNew, addPoInList, processPoIn, addAckInList } from "../services/paymentProcessor.js";

const router = Router();

function readBodyList(req) {
  return req.body && Array.isArray(req.body.data) ? req.body.data : null;
}

router.get("/po_new/", async (_req, res, next) => {
  try { const rows = await getTableRows("PO_NEW", "po_datetime DESC"); sendOk(res, `${rows.length} PO_NEW rows found.`, rows); } catch (err) { next(err); }
});

router.post("/po_new_add/", async (req, res, next) => {
  try {
    const list = readBodyList(req);
    if (!list) return sendBadRequest(res, "Body must be JSON: { data: [ ...paymentOrders ] }.");
const paymentOrders = [];
const rejected = [];

for (let index = 0; index < list.length; index++) {
  const item = list[index];
  const validation = validatePoShape(item);

  if (!validation.valid) {
    rejected.push({
      index,
      code: validation.code,
      message: validation.message,
      input: item
    });

    await pool.query(
      `INSERT INTO LOG
        (message, type, po_id, po_amount, po_message, po_datetime,
         ob_id, oa_id, ob_code, ob_datetime,
         cb_code, cb_datetime,
         bb_id, ba_id, bb_code, bb_datetime)
       VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, NOW(), NULL, NULL, ?, ?, NULL, NULL)`,
      [
        `PO_NEW rejected: ${validation.message}`,
        "po_new_rejected",
        item.po_id ?? null,
        item.po_amount ?? null,
        item.po_message ?? null,
        "BARCBEBB",
        item.oa_id ?? null,
        validation.code,
        item.bb_id ?? null,
        item.ba_id ?? null
      ]
    );

    continue;
  }

  paymentOrders.push(buildPo(item, index + 1));
}

const result = await addPoNewList(paymentOrders);
    if (result.inserted.length === 0 && rejected.length > 0) {
  return res.status(400).json({
    ok: false,
    status: 400,
    code: rejected[0].code,
    message: "No payment orders added. One or more payment orders were rejected.",
    data: {
      inserted: [],
      skipped: result.skipped,
      rejected
    }
  });
}

return sendCreated(
  res,
  `${result.inserted.length} payment orders added to PO_NEW.`,
  {
    inserted: result.inserted,
    skipped: result.skipped,
    rejected
  }
);
  } catch (err) { next(err); }
});

router.get("/po_new_process/", async (_req, res, next) => {
  try { const results = await processPoNew(); sendOk(res, `${results.length} PO_NEW rows processed.`, results); } catch (err) { next(err); }
});

router.get("/po_new_generate/", async (req, res, next) => {
  try {
    const count = Math.min(Math.max(Number(req.query.count || 10), 1), 50);
    const generated = await generateRandomPaymentOrders(count);
    const result = await addPoNewList(generated);
    sendCreated(res, `${result.inserted.length} random payment orders generated and added to PO_NEW.`, { inserted: result.inserted, skipped: result.skipped });
  } catch (err) { next(err); }
});

router.get("/po_out/", async (_req, res, next) => {
  try { const rows = await getTableRows("PO_OUT", "po_datetime DESC"); sendOk(res, `${rows.length} PO_OUT rows found.`, rows); } catch (err) { next(err); }
});

router.get("/po_in/", async (_req, res, next) => {
  try { const rows = await getTableRows("PO_IN", "po_datetime DESC"); sendOk(res, `${rows.length} PO_IN rows found.`, rows); } catch (err) { next(err); }
});

// External alias: POST /api/po_in/ behaves like /api/po_in_add/
router.post("/po_in/", async (req, res, next) => {
  try {
    const list = readBodyList(req);
    if (!list) return sendBadRequest(res, "Body must be JSON: { data: [ ...paymentOrders ] }.");
    const result = await addPoInList(list.map((item, index) => buildPo(item, index + 1)));
    sendCreated(res, `${result.length} incoming payment orders handled.`, result);
  } catch (err) { next(err); }
});

router.post("/po_in_add/", async (req, res, next) => {
  try {
    const list = readBodyList(req);
    if (!list) return sendBadRequest(res, "Body must be JSON: { data: [ ...paymentOrders ] }.");
    const result = await addPoInList(list.map((item, index) => buildPo(item, index + 1)));
    sendCreated(res, `${result.length} incoming payment orders handled.`, result);
  } catch (err) { next(err); }
});

router.get("/po_in_process/", async (_req, res, next) => {
  try { const result = await processPoIn(); sendOk(res, `${result.length} PO_IN rows processed.`, result); } catch (err) { next(err); }
});

router.get("/ack_in/", async (_req, res, next) => {
  try { const rows = await getTableRows("ACK_IN", "received_at DESC"); sendOk(res, `${rows.length} ACK_IN rows found.`, rows); } catch (err) { next(err); }
});

// External alias: POST /api/ack_in/ behaves like /api/ack_in_add/
router.post("/ack_in/", async (req, res, next) => {
  try {
    const list = readBodyList(req);
    if (!list) return sendBadRequest(res, "Body must be JSON: { data: [ ...acknowledgements ] }.");
    const result = await addAckInList(list.map((item, index) => buildPo(item, index + 1)));
    sendCreated(res, `${result.length} acknowledgements handled.`, result);
  } catch (err) { next(err); }
});

router.post("/ack_in_add/", async (req, res, next) => {
  try {
    const list = readBodyList(req);
    if (!list) return sendBadRequest(res, "Body must be JSON: { data: [ ...acknowledgements ] }.");
    const result = await addAckInList(list.map((item, index) => buildPo(item, index + 1)));
    sendCreated(res, `${result.length} acknowledgements handled.`, result);
  } catch (err) { next(err); }
});

router.get("/ack_out/", async (_req, res, next) => {
  try { const rows = await getTableRows("ACK_OUT", "sent_at DESC"); sendOk(res, `${rows.length} ACK_OUT rows found.`, rows); } catch (err) { next(err); }
});

router.get("/transactions/", async (_req, res, next) => {
  try { const rows = await getTableRows("TRANSACTIONS", "datetime DESC"); sendOk(res, `${rows.length} transactions found.`, rows); } catch (err) { next(err); }
});

router.get("/logs/", async (_req, res, next) => {
  try { const rows = await getTableRows("LOG", "datetime DESC"); sendOk(res, `${rows.length} log rows found.`, rows); } catch (err) { next(err); }
});

router.get("/outstanding/", async (_req, res, next) => {
  try { const [rows] = await pool.query("SELECT * FROM v_outstanding_payments ORDER BY po_datetime DESC"); sendOk(res, `${rows.length} outstanding payments found.`, rows); } catch (err) { next(err); }
});

router.get("/failed/", async (_req, res, next) => {
  try { const [rows] = await pool.query("SELECT * FROM v_failed_payments ORDER BY po_id DESC"); sendOk(res, `${rows.length} failed payments found.`, rows); } catch (err) { next(err); }
});

export default router;
