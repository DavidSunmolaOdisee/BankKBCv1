const membersFromEnv = (process.env.TEAM_MEMBERS || "Olusegun Sunmola,Team member 2,Team member 3,Team member 4")
  .split(",")
  .map((member) => member.trim())
  .filter(Boolean);

export const BANK = {
  bic: process.env.TEAM_BIC || process.env.BANK1_BIC || "BARCBEBB",
  name: process.env.TEAM_NAME || process.env.BANK1_NAME || "Bank KBC",
  team: process.env.TEAM_NAME || process.env.BANK1_NAME || "Bank KBC",
  description: "PingFin regular bank API. This bank can act as OB and BB.",
  members: membersFromEnv,
  secretKey: process.env.TEAM_SECRET_KEY || process.env.BANK1_SECRET || process.env.BANK1_SECRET_KEY || ""
};

export const OTHER_BANK = {
  bic: process.env.OTHER_BANK_BIC || process.env.BANK2_BIC || "BBRUBEBB",
  name: process.env.OTHER_BANK_NAME || process.env.BANK2_NAME || "Bankius",
  secretKey: process.env.OTHER_BANK_SECRET_KEY || process.env.BANK2_SECRET || process.env.BANK2_SECRET_KEY || ""
};

export const CB_API_BASE_URL = (process.env.CB_API_BASE_URL || process.env.CB_URL || "https://stevenop.be/pingfin/api/v2").replace(/\/$/, "");

export const CODES = {
  OK: "2000",
  INTERNAL_SENT_TO_CB: "4001",
  AMOUNT_TOO_HIGH: "4002",
  AMOUNT_NEGATIVE: "4003",
  UNKNOWN_BB: "4004",
  DUPLICATE_PO: "4005",
  UNKNOWN_OA: "OB_404_OA",
  UNKNOWN_BA: "BB_404_BA",
  INSUFFICIENT_FUNDS: "OB_402_FUNDS",
  INVALID_IBAN: "OB_400_IBAN",
  INVALID_BIC: "OB_400_BIC",
  INVALID_AMOUNT: "OB_400_AMOUNT"
};
