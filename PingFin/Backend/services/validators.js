import { CODES } from "./config.js";

export function isValidBic(bic) {
  return typeof bic === "string" && /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic);
}

export function isValidIban(iban) {
  if (typeof iban !== "string") return false;
  const clean = iban.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(clean)) return false;
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (char) => String(char.charCodeAt(0) - 55));
  let remainder = 0;
  for (const digit of numeric) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}

export function normalizeAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return Number(amount.toFixed(2));
}

export function validateAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return { valid: false, code: CODES.INVALID_AMOUNT, message: "Amount is not a valid number." };
  if (amount <= 0) return { valid: false, code: CODES.AMOUNT_NEGATIVE, message: "The transaction amount must be positive." };
  if (amount > 500) return { valid: false, code: CODES.AMOUNT_TOO_HIGH, message: "The transaction amount exceeds the 500 euros limit." };
  if (!/^\d+(\.\d{1,2})?$/.test(String(value))) return { valid: false, code: CODES.INVALID_AMOUNT, message: "Amount can have maximum two digits after the comma." };
  return { valid: true, code: CODES.OK, message: "Amount is valid.", amount: normalizeAmount(value) };
}

export function validatePoShape(po) {
  const required = ["po_amount", "po_message", "oa_id", "bb_id", "ba_id"];
  for (const field of required) {
    if (po[field] === undefined || po[field] === null || po[field] === "") {
      return { valid: false, code: "MISSING_FIELD", message: `Missing required field: ${field}` };
    }
  }
  const amountValidation = validateAmount(po.po_amount);
  if (!amountValidation.valid) return amountValidation;
  if (!isValidBic(po.bb_id)) return { valid: false, code: CODES.INVALID_BIC, message: "bb_id must be a valid BIC without spaces." };
  if (!/^BE\d{14}$/.test(String(po.oa_id)) || !/^BE\d{14}$/.test(String(po.ba_id))) {
    return { valid: false, code: CODES.INVALID_IBAN, message: "oa_id and ba_id must be Belgian IBAN-like codes without spaces." };
  }
  return { valid: true, code: CODES.OK, message: "PO shape is valid." };
}
