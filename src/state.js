import { createId, DEFAULT_BUDGET, getMonthKey, toInputDate } from "./helpers.js";

const STORAGE_KEY = "monthly-budget-app";
const BACKUP_STORAGE_KEY = "monthly-budget-app-backup";
const LEGACY_KEYS = ["monthly-budget-app-v4", "monthly-budget-app-v3", "monthly-budget-app-v2", "monthly-budget-app-v1"];

export function loadState() {
  const candidates = [STORAGE_KEY, BACKUP_STORAGE_KEY, ...LEGACY_KEYS];
  for (const key of candidates) {
    const current = readState(key);
    if (current) {
      return normalizeState(current);
    }
  }
  return normalizeState({});
}

export function saveState(state) {
  const serialized = JSON.stringify({
    ...state,
    lastSavedAt: new Date().toISOString(),
  });
  try {
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(BACKUP_STORAGE_KEY, serialized);
  } catch (error) {
    // Ignore storage write errors so the app keeps working.
  }
}

function readState(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

export function normalizeState(saved) {
  const migratedIncome = saved.monthlyIncome && typeof saved.monthlyIncome === "object"
    ? Object.entries(saved.monthlyIncome).map(([monthKey, amount]) => ({
        id: createId(),
        title: "Monthly Income",
        amount: Number(amount) || 0,
        source: "Income",
        date: `${monthKey}-01`,
        note: "Migrated from previous version",
      })).filter(validTransaction)
    : [];

  return {
    defaultBudget: typeof saved.defaultBudget === "number" && saved.defaultBudget >= 0
      ? saved.defaultBudget
      : typeof saved.budget === "number" && saved.budget >= 0
        ? saved.budget
        : DEFAULT_BUDGET,
    monthlyBudgets: saved.monthlyBudgets && typeof saved.monthlyBudgets === "object" ? saved.monthlyBudgets : {},
    expenses: normalizeExpenses(saved.expenses),
    incomeEntries: normalizeIncomes(saved.incomeEntries || migratedIncome),
    recurringRules: Array.isArray(saved.recurringRules) ? saved.recurringRules.map(normalizeRule).filter(Boolean) : [],
    savingsGoals: Array.isArray(saved.savingsGoals) ? saved.savingsGoals.map(normalizeGoal).filter(Boolean) : [],
    categoryBudgets: saved.categoryBudgets && typeof saved.categoryBudgets === "object" ? saved.categoryBudgets : {},
    cloudSync: {
      firebaseConfigText: saved.cloudSync && saved.cloudSync.firebaseConfigText ? saved.cloudSync.firebaseConfigText : "",
      documentPath: saved.cloudSync && saved.cloudSync.documentPath ? saved.cloudSync.documentPath : "",
      lastSyncedAt: saved.cloudSync && saved.cloudSync.lastSyncedAt ? saved.cloudSync.lastSyncedAt : "",
    },
  };
}

function normalizeExpenses(list) {
  return Array.isArray(list)
    ? list.map((item) => ({
        id: item.id || createId(),
        title: String(item.title || "").trim(),
        amount: Number(item.amount) || 0,
        category: String(item.category || "Other"),
        date: item.date || toInputDate(new Date()),
        paymentMode: String(item.paymentMode || "UPI"),
        accountSource: String(item.accountSource || "bank-account"),
        sourceName: String(item.sourceName || ""),
        expenseType: item.expenseType === "want" ? "want" : "need",
        note: String(item.note || "").trim(),
        receiptDataUrl: String(item.receiptDataUrl || ""),
        receiptName: String(item.receiptName || ""),
        recurringKey: item.recurringKey || "",
        smsImported: item.smsImported === true,
        smsSignature: String(item.smsSignature || ""),
      })).filter(validTransaction)
    : [];
}

function normalizeIncomes(list) {
  return Array.isArray(list)
    ? list.map((item) => ({
        id: item.id || createId(),
        title: String(item.title || "").trim(),
        amount: Number(item.amount) || 0,
        source: String(item.source || item.category || "Income"),
        date: item.date || toInputDate(new Date()),
        note: String(item.note || "").trim(),
        recurringKey: item.recurringKey || "",
        sourceName: String(item.sourceName || ""),
        accountSource: String(item.accountSource || "bank-account"),
        smsImported: item.smsImported === true,
        smsSignature: String(item.smsSignature || ""),
      })).filter(validTransaction)
    : [];
}

function normalizeRule(item) {
  if (!item) {
    return null;
  }
  return {
    id: item.id || createId(),
    kind: item.kind === "income" ? "income" : "expense",
    title: String(item.title || "").trim(),
    amount: Number(item.amount) || 0,
    category: String(item.category || "Other"),
    day: Math.min(Math.max(Number(item.day) || 1, 1), 28),
    startMonth: item.startMonth || getMonthKey(new Date()),
    note: String(item.note || "").trim(),
    active: item.active !== false,
  };
}

function normalizeGoal(item) {
  if (!item) {
    return null;
  }
  return {
    id: item.id || createId(),
    name: String(item.name || "").trim(),
    target: Number(item.target) || 0,
    saved: Number(item.saved) || 0,
    deadline: item.deadline || "",
    note: String(item.note || "").trim(),
  };
}

function validTransaction(item) {
  return item.title && item.amount > 0 && item.date;
}

export function ensureMonthState(state, monthKey) {
  if (!(monthKey in state.monthlyBudgets)) {
    state.monthlyBudgets[monthKey] = state.defaultBudget;
  }
  if (!state.categoryBudgets[monthKey]) {
    state.categoryBudgets[monthKey] = {};
  }
}

export function getMonthOptions(state, selectedMonthKey) {
  const set = new Set([
    getMonthKey(new Date()),
    selectedMonthKey,
    ...state.expenses.map((item) => getMonthKey(item.date)),
    ...state.incomeEntries.map((item) => getMonthKey(item.date)),
    ...Object.keys(state.monthlyBudgets),
    ...state.recurringRules.map((item) => item.startMonth),
  ]);
  return [...set].filter(Boolean).sort((a, b) => b.localeCompare(a));
}

export function getExpensesForMonth(state, monthKey) {
  return state.expenses.filter((item) => getMonthKey(item.date) === monthKey);
}

export function getIncomeForMonth(state, monthKey) {
  return state.incomeEntries.filter((item) => getMonthKey(item.date) === monthKey);
}

export function getBudget(state, monthKey) {
  if (monthKey in state.monthlyBudgets) {
    return Number(state.monthlyBudgets[monthKey]) || 0;
  }
  if (typeof state.defaultBudget === "number") {
    return state.defaultBudget;
  }
  return DEFAULT_BUDGET;
}
