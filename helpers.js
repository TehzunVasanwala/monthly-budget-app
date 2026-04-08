export const DEFAULT_BUDGET = 0;
export const COLORS = ["#1f5eff", "#1f8f55", "#d98d23", "#d64545", "#7a5cff", "#0ea5a4", "#ef6a3c"];

export function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buffer = new Uint32Array(4);
    crypto.getRandomValues(buffer);
    return Array.from(buffer, (value) => value.toString(16)).join("-");
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function byId(id) {
  return document.getElementById(id);
}

export function sum(items) {
  return items.reduce((total, item) => total + item.amount, 0);
}

export function getMonthKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getRelativeMonthKey(value, offset) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + offset);
  return getMonthKey(date);
}

export function getDaysInMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

export function getWeeksInMonth(monthKey) {
  return Math.max(Math.ceil(getDaysInMonth(monthKey) / 7), 1);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(value || 0));
}

export function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function shortMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
  }).format(new Date(year, month - 1, 1));
}

export function toInputDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export function emptyState(message) {
  const node = document.createElement("div");
  node.className = "empty-state";
  node.textContent = message;
  return node;
}

export function tone(element, value) {
  element.classList.remove("positive", "negative", "warning");
  if (value === "positive") {
    element.classList.add("positive");
  } else if (value === "negative") {
    element.classList.add("negative");
  } else if (value === "warning") {
    element.classList.add("warning");
  }
}

export function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function csvValue(value) {
  return `"${String(value == null ? "" : value).split('"').join('""')}"`;
}

export function escapeHtml(value) {
  return String(value == null ? "" : value)
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;")
    .split("'").join("&#39;");
}

export function escapeAttribute(value) {
  return String(value == null ? "" : value).split('"').join("&quot;");
}

export function parseSmsMessage(text) {
  const message = String(text || "").trim();
  if (!message) {
    return null;
  }

  const lower = message.toLowerCase();
  const amountMatch = message.match(/(?:inr|rs\.?|mrp)\s*([0-9,]+(?:\.\d{1,2})?)/i);
  const amount = amountMatch ? Number(amountMatch[1].split(",").join("")) : 0;
  if (!amount) {
    return null;
  }

  const accountSource = detectAccountSource(lower);
  const sourceName = detectSourceName(message, accountSource);
  const merchant = detectMerchant(message);
  const date = detectMessageDate(message);
  const isIncome = /\b(credited|received|deposit|deposited|refund)\b/i.test(lower) && !/\bdebit(ed)?\b/i.test(lower);
  const title = isIncome ? "SMS Income" : merchant || "SMS Expense";
  const paymentMode = detectPaymentMode(lower, accountSource);
  const notePrefix = isIncome ? "Imported from SMS income alert." : "Imported from SMS debit alert.";
  const smsSignature = [
    isIncome ? "income" : "expense",
    date,
    String(amount),
    merchant || title,
    accountSource,
    sourceName,
  ].join("|").toLowerCase();

  return {
    kind: isIncome ? "income" : "expense",
    title,
    amount,
    category: categorizeMerchant(merchant, lower),
    source: sourceName || accountSourceLabel(accountSource),
    sourceName,
    accountSource,
    paymentMode,
    date,
    note: `${notePrefix} ${message}`,
    smsImported: true,
    smsSignature,
  };
}

export function accountSourceLabel(value) {
  const labels = {
    "bank-account": "Bank Account",
    "debit-card": "Debit Card",
    "credit-card": "Credit Card",
    upi: "UPI",
    cash: "Cash",
    wallet: "Wallet",
    other: "Other",
  };
  return labels[value] || "Other";
}

function detectAccountSource(lower) {
  if (/\bcredit card\b|\bcc\b/.test(lower)) {
    return "credit-card";
  }
  if (/\bdebit card\b|\bdc\b/.test(lower)) {
    return "debit-card";
  }
  if (/\bupi\b/.test(lower)) {
    return "upi";
  }
  if (/\bwallet\b/.test(lower)) {
    return "wallet";
  }
  if (/\ba\/c\b|\baccount\b|\bacct\b|\bbank\b/.test(lower)) {
    return "bank-account";
  }
  return "other";
}

function detectPaymentMode(lower, accountSource) {
  if (/\bupi\b/.test(lower)) {
    return "UPI";
  }
  if (/\bimps\b|\bneft\b|\brtgs\b/.test(lower)) {
    return "Bank";
  }
  if (accountSource === "credit-card" || accountSource === "debit-card") {
    return "Card";
  }
  if (accountSource === "wallet") {
    return "Wallet";
  }
  if (accountSource === "bank-account") {
    return "Bank";
  }
  return "Other";
}

function detectSourceName(message, accountSource) {
  const cardMatch = message.match(/(?:card|credit card|debit card)\s*(?:xx|x{2,}|ending|ending with|no\.?)?\s*([0-9]{4})/i);
  if (cardMatch) {
    return `${accountSourceLabel(accountSource)} ${cardMatch[1]}`;
  }
  const accountMatch = message.match(/(?:a\/c|acct|account)\s*(?:xx|x{2,}|ending|ending with|no\.?)?\s*([0-9]{4})/i);
  if (accountMatch) {
    return `A/C ${accountMatch[1]}`;
  }
  return "";
}

function detectMerchant(message) {
  const patterns = [
    /\bat\s+([A-Za-z0-9 &._-]{3,40})/i,
    /\bto\s+([A-Za-z0-9 &._-]{3,40})/i,
    /\bon\s+([A-Za-z0-9 &._-]{3,40})/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return cleanMerchant(match[1]);
    }
  }
  return "";
}

function cleanMerchant(value) {
  return String(value || "")
    .split(".")[0]
    .split(",")[0]
    .split(" Avl")[0]
    .split(" Ref")[0]
    .trim();
}

function detectMessageDate(message) {
  const match = message.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/);
  if (!match) {
    return toInputDate(new Date());
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) {
    year += 2000;
  }
  return toInputDate(new Date(year, month - 1, day));
}

function categorizeMerchant(merchant, lower) {
  const value = `${merchant || ""} ${lower}`.toLowerCase();
  if (/swiggy|zomato|restaurant|food|cafe|hotel/.test(value)) {
    return "Food";
  }
  if (/uber|ola|metro|petrol|fuel|travel|air|rail/.test(value)) {
    return "Travel";
  }
  if (/electricity|water|bill|emi|rent|broadband|recharge|insurance/.test(value)) {
    return "Bills";
  }
  if (/pharmacy|hospital|health|medical/.test(value)) {
    return "Health";
  }
  if (/amazon|flipkart|mall|shopping|store/.test(value)) {
    return "Shopping";
  }
  return "Other";
}
