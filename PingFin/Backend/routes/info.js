import { Router } from "express";
import { BANK, OTHER_BANK, CB_API_BASE_URL } from "../services/config.js";

const router = Router();

router.get("/info/", (_req, res) => {
  res.status(200).json({
    ok: true,
    status: 200,
    code: 2000,
    message: "OK",
    data: {
      team: BANK.team,
      bic: BANK.bic,
      members: BANK.members,
      bank_name: BANK.name,
      bank_type: "Regular bank / OB and BB",
      description: BANK.description,
      default_other_bank_bic: OTHER_BANK.bic,
      clearing_bank_api_docs: CB_API_BASE_URL
    }
  });
});

export default router;
