import { pool } from "./database.js";

export async function getAllAccounts() {
  const [rows] = await pool.query(
    "SELECT id, account_name, balance, created_at FROM ACCOUNTS ORDER BY id"
  );
  return rows;
}

export async function getAccountByIban(iban) {
  const [rows] = await pool.query(
    "SELECT id, account_name, balance, created_at FROM ACCOUNTS WHERE id = ? LIMIT 1",
    [iban]
  );
  return rows[0] ?? null;
}

export async function accountExists(iban, conn = pool) {
  const [rows] = await conn.query(
    "SELECT id, balance FROM ACCOUNTS WHERE id = ? LIMIT 1",
    [iban]
  );
  return rows[0] ?? null;
}
