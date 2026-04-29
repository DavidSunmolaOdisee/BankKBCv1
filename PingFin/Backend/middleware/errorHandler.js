import { apiResponse } from "../services/response.js";

export function notFoundHandler(req, res) {
  res.status(404).json(apiResponse(false, 404, "NOT_FOUND", `Endpoint not found: ${req.method} ${req.originalUrl}`, null));
}

export function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json(apiResponse(false, status, err.code || "SERVER_ERROR", err.message || "Unexpected server error.", null));
}
