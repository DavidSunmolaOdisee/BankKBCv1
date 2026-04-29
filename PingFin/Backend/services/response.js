export function apiResponse(ok, status, code = null, message = null, data = null) {
  return { ok, status, code, message, data };
}

export function sendOk(res, message, data = null, code = "2000") {
  return res.status(200).json(apiResponse(true, 200, code, message, data));
}

export function sendCreated(res, message, data = null, code = "2000") {
  return res.status(201).json(apiResponse(true, 201, code, message, data));
}

export function sendBadRequest(res, message, code = "BAD_REQUEST", data = null) {
  return res.status(400).json(apiResponse(false, 400, code, message, data));
}

export function sendNotFound(res, message, code = "NOT_FOUND", data = null) {
  return res.status(404).json(apiResponse(false, 404, code, message, data));
}
