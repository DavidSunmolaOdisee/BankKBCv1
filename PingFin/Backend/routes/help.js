import { Router } from "express";
import { sendOk } from "../services/response.js";

const router = Router();

router.get("/help/", (_req, res) => {
  sendOk(res, "PingFin API endpoint overview.", {
    required_regular_bank_endpoints: [
      { method: "GET", endpoint: "/api/help/", description: "Overview of API endpoints." },
      { method: "GET", endpoint: "/api/info/", description: "Team info, bank name and BIC." },
      { method: "GET", endpoint: "/api/accounts/", description: "All accounts." },
      { method: "GET", endpoint: "/api/accounts/:iban", description: "One account by IBAN." },
      { method: "GET", endpoint: "/api/po_new/", description: "All payment orders in PO_NEW." },
      { method: "POST", endpoint: "/api/po_new_add/", description: "Add payment orders to PO_NEW. Body: { data: [ ... ] }." },
      { method: "GET", endpoint: "/api/po_new_process/", description: "Process all PO_NEW rows with status NEW." }
    ],
    extra_test_endpoints: [
      { method: "GET", endpoint: "/api/po_out/", description: "Show outgoing payment orders." },
      { method: "GET", endpoint: "/api/po_in/", description: "Show incoming payment orders." },
      { method: "POST", endpoint: "/api/po_in_add/", description: "Receive PO list from CB as BB. Body: { data: [ ... ] }." },
      { method: "GET", endpoint: "/api/po_in_process/", description: "Process incoming PO_IN rows and create ACK_OUT." },
      { method: "GET", endpoint: "/api/ack_in/", description: "Show ACK_IN rows." },
      { method: "POST", endpoint: "/api/ack_in_add/", description: "Receive ACK list from CB as OB. Body: { data: [ ... ] }." },
      { method: "GET", endpoint: "/api/ack_out/", description: "Show ACK_OUT rows." },
      { method: "GET", endpoint: "/api/transactions/", description: "Show transactions." },
      { method: "GET", endpoint: "/api/logs/", description: "Show logs." },
      { method: "GET", endpoint: "/api/outstanding/", description: "PO_OUT rows without ACK_IN." },
      { method: "GET", endpoint: "/api/failed/", description: "Failed payments." },
      { method: "GET", endpoint: "/api/po_new_generate/?count=10", description: "Optional: generate random PO test data." },
      { method: "GET", endpoint: "/api/db_check/", description: "Check database connection." }
    ],
    response_format: { ok: "boolean", status: "HTTP status code", code: "message or error code", message: "human-readable message", data: "array/object/null" }
  });
});

export default router;
