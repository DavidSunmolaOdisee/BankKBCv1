import { Router } from "express";
import { sendBadRequest, sendCreated, sendOk } from "../services/response.js";
import { BANK } from "../services/config.js";
import {
  fetchAckInFromCentralBank,
  fetchPoInFromCentralBank,
  getCentralBankBanks,
  getCentralBankStats,
  getCentralBankToken,
  sendAckOutToCentralBank,
  sendPoOutToCentralBank,
  updateCentralBankBankInfo
} from "../services/centralBankService.js";

const router = Router();

function readBank(req) {
  return req.query.bank || req.body?.bank || "A";
}

function readBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") return defaultValue;
  return ["1", "true", "yes", "y"].includes(String(value).toLowerCase());
}

router.get("/cb/token/", async (req, res, next) => {
  try {
    const tokenData = await getCentralBankToken(readBank(req), { forceRefresh: readBoolean(req.query.force, false) });
    sendOk(res, "Token received from central bank.", {
      bank: tokenData.bank,
      bic: tokenData.bic,
      cached: tokenData.cached,
      createdAt: tokenData.createdAt,
      expiresAt: tokenData.expiresAt,
      token_preview: `${tokenData.token.slice(0, 6)}...${tokenData.token.slice(-4)}`
    });
  } catch (err) { next(err); }
});

router.get("/cb/banks/", async (req, res, next) => {
  try {
    const result = await getCentralBankBanks(readBank(req));
    sendOk(res, "Banks loaded from central bank.", result.response.data, result.response.code || "2000");
  } catch (err) { next(err); }
});

router.post("/cb/banks/", async (req, res, next) => {
  try {
    const name = req.body?.name || BANK.name;
    const members = req.body?.members || BANK.members.join(", ");
    if (!name || !members) return sendBadRequest(res, "Body must contain name and members.");
    const result = await updateCentralBankBankInfo({ bank: readBank(req), name, members });
    sendOk(res, "Bank info updated at central bank.", result.response);
  } catch (err) { next(err); }
});

router.get("/cb/logs/", async (req, res, next) => {
  try {
    const result = await getCentralBankStats(readBank(req));
    sendOk(res, "Central bank logs loaded.", result.response.data);
  } catch (err) { next(err); }
});

router.post("/cb/send-po-out/", async (req, res, next) => {
  try {
    const result = await sendPoOutToCentralBank({
      bank: readBank(req),
      poId: req.body?.po_id || req.query.po_id || null,
      includeAll: readBoolean(req.body?.includeAll ?? req.query.includeAll, false)
    });
    sendCreated(res, `${result.sent_count} PO_OUT rows sent to central bank.`, result);
  } catch (err) { next(err); }
});

router.get("/cb/fetch-po-in/", async (req, res, next) => {
  try {
    const result = await fetchPoInFromCentralBank({
      bank: readBank(req),
      test: readBoolean(req.query.test, true)
    });
    sendOk(res, `${result.received_count} PO rows fetched from central bank.`, result);
  } catch (err) { next(err); }
});

router.post("/cb/send-ack-out/", async (req, res, next) => {
  try {
    const result = await sendAckOutToCentralBank({
      bank: readBank(req),
      poId: req.body?.po_id || req.query.po_id || null,
      includeAll: readBoolean(req.body?.includeAll ?? req.query.includeAll, true)
    });
    sendCreated(res, `${result.sent_count} ACK_OUT rows sent to central bank.`, result);
  } catch (err) { next(err); }
});

router.get("/cb/fetch-ack-in/", async (req, res, next) => {
  try {
    const result = await fetchAckInFromCentralBank({
      bank: readBank(req),
      test: readBoolean(req.query.test, true)
    });
    sendOk(res, `${result.received_count} ACK rows fetched from central bank.`, result);
  } catch (err) { next(err); }
});

export default router;
