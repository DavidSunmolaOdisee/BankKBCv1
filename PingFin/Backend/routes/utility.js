import { Router } from "express";
import { testConnection, DB_CONFIG } from "../db/database.js";
import { sendOk } from "../services/response.js";

const router = Router();

router.get("/db_check/", async (_req, res) => {
  const result = await testConnection();
  sendOk(res, result.message, { success: result.success, host: DB_CONFIG.host, port: DB_CONFIG.port, database: DB_CONFIG.database, user: DB_CONFIG.user }, result.success ? "2000" : "DB_ERROR");
});

export default router;
