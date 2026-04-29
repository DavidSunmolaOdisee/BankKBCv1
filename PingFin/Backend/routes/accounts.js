import { Router } from "express";
import { getAllAccounts, getAccountByIban } from "../db/accounts.js";
import { sendOk, sendNotFound } from "../services/response.js";

const router = Router();

router.get("/accounts/", async (_req, res, next) => {
  try {
    const accounts = await getAllAccounts();
    sendOk(res, `${accounts.length} accounts found.`, accounts);
  } catch (err) { next(err); }
});

router.get("/accounts/:iban", async (req, res, next) => {
  try {
    const account = await getAccountByIban(req.params.iban);
    if (!account) return sendNotFound(res, "Account not found.", "ACCOUNT_NOT_FOUND");
    sendOk(res, "Account found.", account);
  } catch (err) { next(err); }
});

export default router;
