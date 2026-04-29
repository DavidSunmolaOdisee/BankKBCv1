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
    list.forEach((item, index) => {
      const validation = validatePoShape(item);
      if (!validation.valid) rejected.push({ index, code: validation.code, message: validation.message, input: item });
      else paymentOrders.push(buildPo(item, index + 1));
    });
    const result = await addPoNewList(paymentOrders);
    sendCreated(res, `${result.inserted.length} payment orders added to PO_NEW.`, { inserted: result.inserted, skipped: result.skipped, rejected });
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
