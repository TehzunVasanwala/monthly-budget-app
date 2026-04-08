import {
  accountSourceLabel,
  byId,
  createId,
  csvValue,
  downloadFile,
  emptyState,
  formatCurrency,
  formatDate,
  formatMonthLabel,
  getDaysInMonth,
  getMonthKey,
  getRelativeMonthKey,
  parseSmsMessage,
  shortMonth,
  sum,
  toInputDate,
  tone,
} from "./helpers.js";
import {
  ensureMonthState,
  getBudget,
  getExpensesForMonth,
  getIncomeForMonth,
  getMonthOptions,
  loadState,
  normalizeState,
  saveState,
} from "./state.js";
import {
  renderAlerts,
  renderCategoryBudgets,
  renderCategoryChart,
  renderCategoryFilter,
  renderGoals,
  renderMonthFilter,
  renderRecurringList,
  renderSavingsHistory,
  renderTrend,
} from "./render.js";
import { pullCloudState, pushCloudState, resetCloudContext } from "./sync.js";

const state = loadState();
let selectedMonthKey = getMonthKey(new Date());
let activeView = "home";
let activeEditId = "";
let deferredPrompt = null;
let pendingReceiptData = "";
let pendingReceiptName = "";
let smsPreviewEntries = [];
const amountShortcuts = [100, 200, 500, 1000, 2000, 5000];

const els = {
  installButton: byId("installButton"),
  monthFilter: byId("monthFilter"),
  saveMonthSettingsButton: byId("saveMonthSettingsButton"),
  selectedMonthTitle: byId("selectedMonthTitle"),
  budgetLeftDisplay: byId("budgetLeftDisplay"),
  spentDisplay: byId("spentDisplay"),
  savedDisplay: byId("savedDisplay"),
  incomeDisplay: byId("incomeDisplay"),
  progressText: byId("progressText"),
  progressFill: byId("progressFill"),
  alertsList: byId("alertsList"),
  quickAddExpenseButton: byId("quickAddExpenseButton"),
  quickAddIncomeButton: byId("quickAddIncomeButton"),
  quickOpenHistoryButton: byId("quickOpenHistoryButton"),
  monthSettingsNote: byId("monthSettingsNote"),
  smsImportedCountHomeDisplay: byId("smsImportedCountHomeDisplay"),
  smsBankCountDisplay: byId("smsBankCountDisplay"),
  smsCreditCountDisplay: byId("smsCreditCountDisplay"),
  smsLastImportDisplay: byId("smsLastImportDisplay"),
  smsHomeList: byId("smsHomeList"),
  openSmsImportButton: byId("openSmsImportButton"),
  openCreditHistoryButton: byId("openCreditHistoryButton"),
  quickCategoryChips: byId("quickCategoryChips"),
  pinnedCategoryList: byId("pinnedCategoryList"),
  bankSpendDisplay: byId("bankSpendDisplay"),
  creditSpendDisplay: byId("creditSpendDisplay"),
  otherSpendDisplay: byId("otherSpendDisplay"),
  smsImportedCountDisplay: byId("smsImportedCountDisplay"),
  billReminderList: byId("billReminderList"),
  recentExpenseList: byId("recentExpenseList"),
  expenseForm: byId("expenseForm"),
  titleInput: byId("titleInput"),
  amountInput: byId("amountInput"),
  amountShortcutChips: byId("amountShortcutChips"),
  addCategoryShortcutChips: byId("addCategoryShortcutChips"),
  categoryInput: byId("categoryInput"),
  dateInput: byId("dateInput"),
  paymentModeInput: byId("paymentModeInput"),
  accountSourceInput: byId("accountSourceInput"),
  sourceNameInput: byId("sourceNameInput"),
  expenseTypeInput: byId("expenseTypeInput"),
  receiptInput: byId("receiptInput"),
  noteInput: byId("noteInput"),
  incomeForm: byId("incomeForm"),
  incomeTitleInput: byId("incomeTitleInput"),
  incomeAmountInput: byId("incomeAmountInput"),
  incomeSourceInput: byId("incomeSourceInput"),
  incomeDateInput: byId("incomeDateInput"),
  incomeNoteInput: byId("incomeNoteInput"),
  searchInput: byId("searchInput"),
  categoryFilter: byId("categoryFilter"),
  fromDateFilter: byId("fromDateFilter"),
  toDateFilter: byId("toDateFilter"),
  clearButton: byId("clearButton"),
  expenseListCaption: byId("expenseListCaption"),
  expenseList: byId("expenseList"),
  incomeList: byId("incomeList"),
  creditExpenseList: byId("creditExpenseList"),
  totalSavingsDisplay: byId("totalSavingsDisplay"),
  trackedMonthsDisplay: byId("trackedMonthsDisplay"),
  bestMonthDisplay: byId("bestMonthDisplay"),
  savingsHistoryList: byId("savingsHistoryList"),
  goalForm: byId("goalForm"),
  goalNameInput: byId("goalNameInput"),
  goalTargetInput: byId("goalTargetInput"),
  goalSavedInput: byId("goalSavedInput"),
  goalDeadlineInput: byId("goalDeadlineInput"),
  goalNoteInput: byId("goalNoteInput"),
  goalList: byId("goalList"),
  trendChart: byId("trendChart"),
  categoryDonut: byId("categoryDonut"),
  categoryLegend: byId("categoryLegend"),
  lastMonthSpentDisplay: byId("lastMonthSpentDisplay"),
  lastMonthSavedDisplay: byId("lastMonthSavedDisplay"),
  lastMonthCountDisplay: byId("lastMonthCountDisplay"),
  lastMonthNote: byId("lastMonthNote"),
  recurringForm: byId("recurringForm"),
  recurringKindInput: byId("recurringKindInput"),
  recurringTitleInput: byId("recurringTitleInput"),
  recurringAmountInput: byId("recurringAmountInput"),
  recurringCategoryInput: byId("recurringCategoryInput"),
  recurringDayInput: byId("recurringDayInput"),
  recurringStartInput: byId("recurringStartInput"),
  recurringNoteInput: byId("recurringNoteInput"),
  recurringList: byId("recurringList"),
  categoryBudgetForm: byId("categoryBudgetForm"),
  categoryBudgetNameInput: byId("categoryBudgetNameInput"),
  categoryBudgetAmountInput: byId("categoryBudgetAmountInput"),
  categoryBudgetList: byId("categoryBudgetList"),
  shareAppButton: byId("shareAppButton"),
  shareAppStatus: byId("shareAppStatus"),
  firebaseConfigInput: byId("firebaseConfigInput"),
  firebaseDocumentPathInput: byId("firebaseDocumentPathInput"),
  saveCloudSettingsButton: byId("saveCloudSettingsButton"),
  pushCloudButton: byId("pushCloudButton"),
  pullCloudButton: byId("pullCloudButton"),
  cloudStatusNote: byId("cloudStatusNote"),
  exportCsvButton: byId("exportCsvButton"),
  smsImportInput: byId("smsImportInput"),
  previewSmsButton: byId("previewSmsButton"),
  importSmsButton: byId("importSmsButton"),
  smsImportStatus: byId("smsImportStatus"),
  smsImportList: byId("smsImportList"),
  viewButtons: [...document.querySelectorAll("[data-view-btn]")],
  views: [...document.querySelectorAll("[data-view]")],
  editDialog: byId("editDialog"),
  editForm: byId("editForm"),
  editTitleInput: byId("editTitleInput"),
  editAmountInput: byId("editAmountInput"),
  editCategoryInput: byId("editCategoryInput"),
  editDateInput: byId("editDateInput"),
  editNoteInput: byId("editNoteInput"),
  cancelEditButton: byId("cancelEditButton"),
  expenseItemTemplate: byId("expenseItemTemplate"),
  simpleItemTemplate: byId("simpleItemTemplate"),
};

safeBoot();

function safeBoot() {
  unregisterLegacyServiceWorkers();
  try {
    boot();
  } catch (error) {
    renderFatalError(error);
  }
}

function boot() {
  ensureMonthState(state, selectedMonthKey);
  applyRecurringRules();
  setDefaultDates();
  hydrateCloudSettings();
  renderAddShortcuts();
  bindEvents();
  registerPwaEvents();
  render();
}

function unregisterLegacyServiceWorkers() {
  if (!("serviceWorker" in navigator) || !navigator.serviceWorker.getRegistrations) {
    return;
  }
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  }).catch(() => {
    // Ignore cleanup failures and continue booting the app.
  });
}

function renderFatalError(error) {
  const message = error && error.message ? error.message : "Unknown startup error";
  const box = document.createElement("div");
  box.style.margin = "20px";
  box.style.padding = "16px";
  box.style.borderRadius = "16px";
  box.style.background = "#fff4f4";
  box.style.border = "1px solid #f1b7b7";
  box.style.color = "#9f1f1f";
  box.innerHTML = `<strong>App startup issue</strong><p style="margin:8px 0 0;">${message}</p>`;
  document.body.prepend(box);
}

function bindEvents() {
  els.monthFilter.addEventListener("change", () => {
    selectedMonthKey = els.monthFilter.value;
    ensureMonthState(state, selectedMonthKey);
    applyRecurringRules();
    render();
  });

  els.saveMonthSettingsButton.addEventListener("click", () => {
    const current = getBudget(state, selectedMonthKey);
    const response = window.prompt(`Enter budget for ${formatMonthLabel(selectedMonthKey)}`, String(current));
    if (response === null) {
      return;
    }
    const nextBudget = Number(response);
    if (!nextBudget || nextBudget <= 0) {
      window.alert("Please enter a valid budget amount.");
      return;
    }
    state.monthlyBudgets[selectedMonthKey] = nextBudget;
    persist();
  });

  els.viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeView = button.dataset.viewBtn;
      syncViews();
    });
  });

  if (els.quickAddExpenseButton) {
    els.quickAddExpenseButton.addEventListener("click", () => {
      activeView = "add";
      syncViews();
      els.titleInput.focus();
    });
  }

  if (els.quickAddIncomeButton) {
    els.quickAddIncomeButton.addEventListener("click", () => {
      activeView = "add";
      syncViews();
      els.incomeTitleInput.focus();
    });
  }

  if (els.quickOpenHistoryButton) {
    els.quickOpenHistoryButton.addEventListener("click", () => {
      activeView = "history";
      syncViews();
      els.searchInput.focus();
    });
  }

  if (els.openSmsImportButton) {
    els.openSmsImportButton.addEventListener("click", () => {
      activeView = "more";
      syncViews();
      els.smsImportInput.focus();
    });
  }

  if (els.openCreditHistoryButton) {
    els.openCreditHistoryButton.addEventListener("click", () => {
      activeView = "history";
      syncViews();
    });
  }

  if (els.saveCloudSettingsButton) {
    els.saveCloudSettingsButton.addEventListener("click", saveCloudSettings);
  }

  if (els.pushCloudButton) {
    els.pushCloudButton.addEventListener("click", pushCloudData);
  }

  if (els.pullCloudButton) {
    els.pullCloudButton.addEventListener("click", pullCloudData);
  }

  els.expenseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.expenses.unshift({
      id: createId(),
      title: els.titleInput.value.trim(),
      amount: Number(els.amountInput.value),
      category: els.categoryInput.value,
      date: els.dateInput.value,
      paymentMode: els.paymentModeInput ? els.paymentModeInput.value : "UPI",
      accountSource: els.accountSourceInput ? els.accountSourceInput.value : "other",
      sourceName: els.sourceNameInput ? els.sourceNameInput.value.trim() : "",
      expenseType: els.expenseTypeInput ? els.expenseTypeInput.value : "need",
      note: els.noteInput ? els.noteInput.value.trim() : "",
      receiptDataUrl: "",
      receiptName: "",
      recurringKey: "",
      smsImported: false,
      smsSignature: "",
    });
    resetExpenseForm();
    persist();
    activeView = "home";
    syncViews();
  });

  els.incomeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.incomeEntries.unshift({
      id: createId(),
      title: els.incomeTitleInput.value.trim(),
      amount: Number(els.incomeAmountInput.value),
      source: els.incomeSourceInput.value.trim(),
      date: els.incomeDateInput.value,
      note: els.incomeNoteInput ? els.incomeNoteInput.value.trim() : "",
      recurringKey: "",
      sourceName: els.incomeSourceInput.value.trim(),
      accountSource: "bank-account",
      smsImported: false,
      smsSignature: "",
    });
    els.incomeForm.reset();
    els.incomeDateInput.value = toInputDate(new Date());
    persist();
  });

  if (els.goalForm) {
    els.goalForm.addEventListener("submit", (event) => {
      event.preventDefault();
      state.savingsGoals.unshift({
        id: createId(),
        name: els.goalNameInput.value.trim(),
        target: Number(els.goalTargetInput.value),
        saved: Number(els.goalSavedInput.value),
        deadline: els.goalDeadlineInput.value,
        note: els.goalNoteInput.value.trim(),
      });
      els.goalForm.reset();
      persist();
    });
  }

  if (els.recurringForm) {
    els.recurringForm.addEventListener("submit", (event) => {
      event.preventDefault();
      state.recurringRules.unshift({
        id: createId(),
        kind: els.recurringKindInput.value,
        title: els.recurringTitleInput.value.trim(),
        amount: Number(els.recurringAmountInput.value),
        category: els.recurringCategoryInput.value.trim(),
        day: Number(els.recurringDayInput.value),
        startMonth: els.recurringStartInput.value,
        note: els.recurringNoteInput.value.trim(),
        active: true,
      });
      els.recurringForm.reset();
      els.recurringStartInput.value = selectedMonthKey;
      persist();
    });
  }

  if (els.categoryBudgetForm) {
    els.categoryBudgetForm.addEventListener("submit", (event) => {
      event.preventDefault();
      ensureMonthState(state, selectedMonthKey);
      state.categoryBudgets[selectedMonthKey][els.categoryBudgetNameInput.value.trim()] = Number(els.categoryBudgetAmountInput.value);
      els.categoryBudgetForm.reset();
      persist();
    });
  }

  ["input", "change"].forEach((eventName) => {
    els.searchInput.addEventListener(eventName, render);
    els.categoryFilter.addEventListener(eventName, render);
    els.fromDateFilter.addEventListener(eventName, render);
    els.toDateFilter.addEventListener(eventName, render);
  });

  els.clearButton.addEventListener("click", () => {
    const ok = window.confirm(`Clear all expenses and income for ${formatMonthLabel(selectedMonthKey)}?`);
    if (!ok) {
      return;
    }
    state.expenses = state.expenses.filter((item) => getMonthKey(item.date) !== selectedMonthKey);
    state.incomeEntries = state.incomeEntries.filter((item) => getMonthKey(item.date) !== selectedMonthKey);
    persist();
  });

  els.expenseList.addEventListener("click", handleExpenseActions);
  els.recentExpenseList.addEventListener("click", handleExpenseActions);
  els.incomeList.addEventListener("click", handleDeleteOnly);
  if (els.goalList) {
    els.goalList.addEventListener("click", handleDeleteOnly);
  }
  if (els.recurringList) {
    els.recurringList.addEventListener("click", handleDeleteOnly);
  }
  if (els.categoryBudgetList) {
    els.categoryBudgetList.addEventListener("click", handleDeleteOnly);
  }

  els.editForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const entry = state.expenses.find((item) => item.id === activeEditId);
    if (!entry) {
      return;
    }
    entry.title = els.editTitleInput.value.trim();
    entry.amount = Number(els.editAmountInput.value);
    entry.category = els.editCategoryInput.value.trim();
    entry.date = els.editDateInput.value;
    entry.note = els.editNoteInput.value.trim();
    activeEditId = "";
    closeDialog(els.editDialog);
    persist();
  });

  els.cancelEditButton.addEventListener("click", () => {
    activeEditId = "";
    closeDialog(els.editDialog);
  });

  els.shareAppButton.addEventListener("click", shareAppLink);
  els.exportCsvButton.addEventListener("click", exportCsv);
  els.previewSmsButton.addEventListener("click", previewSmsImports);
  els.importSmsButton.addEventListener("click", importSmsEntries);
}

function registerPwaEvents() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    els.installButton.hidden = false;
  });

  els.installButton.addEventListener("click", async () => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    els.installButton.hidden = true;
  });
}

function render() {
  ensureMonthState(state, selectedMonthKey);
  applyRecurringRules();

  const monthOptions = getMonthOptions(state, selectedMonthKey);
  renderMonthFilter(els.monthFilter, monthOptions, selectedMonthKey);

  const monthExpenses = getExpensesForMonth(state, selectedMonthKey).sort((a, b) => new Date(b.date) - new Date(a.date));
  const monthIncome = getIncomeForMonth(state, selectedMonthKey).sort((a, b) => new Date(b.date) - new Date(a.date));
  const summary = buildMonthSummary(selectedMonthKey, monthExpenses, monthIncome);
  const groupedCategories = groupByCategory(monthExpenses);
  const filteredExpenses = getFilteredExpenses(monthExpenses);
  const savingsSummaries = listMonths().map((monthKey) => {
    const expenses = getExpensesForMonth(state, monthKey);
    const income = getIncomeForMonth(state, monthKey);
    return buildMonthSummary(monthKey, expenses, income);
  });

  els.selectedMonthTitle.textContent = formatMonthLabel(selectedMonthKey);
  els.budgetLeftDisplay.textContent = formatCurrency(summary.remaining);
  els.spentDisplay.textContent = formatCurrency(summary.spent);
  els.savedDisplay.textContent = formatCurrency(summary.saved);
  els.incomeDisplay.textContent = formatCurrency(summary.income);
  els.progressText.textContent = `${Math.round(summary.usage)}%`;
  els.progressFill.style.width = `${Math.min(summary.usage, 100)}%`;
  els.monthSettingsNote.textContent = summary.budget > 0
    ? `Budget for ${formatMonthLabel(selectedMonthKey)} is ${formatCurrency(summary.budget)}.`
    : `No budget set for ${formatMonthLabel(selectedMonthKey)} yet. Tap Save Budget to update it.`;
  tone(els.budgetLeftDisplay, summary.remaining < 0 ? "negative" : "positive");
  tone(els.spentDisplay, "negative");
  tone(els.savedDisplay, summary.saved < 0 ? "negative" : "positive");
  tone(els.incomeDisplay, "positive");

  renderAlerts(els.alertsList, summary, groupedCategories, state.categoryBudgets[selectedMonthKey] || {});
  renderHomeSmsSection(monthExpenses, monthIncome);
  renderRecentExpenses(monthExpenses);
  renderCategoryFilter(els.categoryFilter, monthExpenses);
  renderExpenseList(filteredExpenses);
  renderIncomeList(monthIncome);
  renderCreditExpenseList(monthExpenses);
  renderSavingsSection(savingsSummaries);
  renderGoals(els.goalList, state.savingsGoals, savingsSummaries.reduce((total, item) => total + item.saved, 0));
  if (els.trendChart && els.categoryDonut && els.categoryLegend) {
    renderTrend(els.trendChart, savingsSummaries.slice(0, 6).reverse());
    renderCategoryChart(els.categoryDonut, els.categoryLegend, groupedCategories);
  }
  if (els.lastMonthSpentDisplay && els.lastMonthSavedDisplay && els.lastMonthCountDisplay && els.lastMonthNote) {
    renderLastMonth();
  }
  if (els.recurringList) {
    renderRecurringList(els.recurringList, els.simpleItemTemplate, state.recurringRules);
  }
  if (els.categoryBudgetList) {
    renderCategoryBudgets(els.categoryBudgetList, selectedMonthKey, state.categoryBudgets[selectedMonthKey] || {}, groupedCategories);
  }
  renderSmsPreview();
  renderCloudStatus();

  els.expenseListCaption.textContent = `${filteredExpenses.length} expense${filteredExpenses.length === 1 ? "" : "s"} shown for ${formatMonthLabel(selectedMonthKey)}.`;
  if (els.recurringStartInput) {
    els.recurringStartInput.value = els.recurringStartInput.value || selectedMonthKey;
  }
  syncViews();
}

function renderQuickCategoryChips(groupedCategories) {
  if (!els.quickCategoryChips) {
    return;
  }
  const quickCategories = ["Food", "Travel", "Bills", "Shopping", "Health", "Family"];
  const favorites = [...new Set([...groupedCategories.map((item) => item.category), ...quickCategories])].slice(0, 6);
  els.quickCategoryChips.innerHTML = "";
  favorites.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip quick-chip";
    button.textContent = category;
    button.addEventListener("click", () => {
      moveToQuickExpense(category);
    });
    els.quickCategoryChips.appendChild(button);
  });
}

function renderAddShortcuts() {
  if (!els.amountShortcutChips) {
    return;
  }
  els.amountShortcutChips.innerHTML = "";
  amountShortcuts.forEach((amount) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quick-chip";
    button.textContent = formatCurrency(amount);
    button.addEventListener("click", () => {
      els.amountInput.value = amount;
      els.amountInput.focus();
      highlightSelection(els.amountShortcutChips, button);
    });
    els.amountShortcutChips.appendChild(button);
  });

  if (els.addCategoryShortcutChips) {
    const quickCategories = ["Food", "Travel", "Bills", "Shopping", "Health", "Family"];
    els.addCategoryShortcutChips.innerHTML = "";
    quickCategories.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quick-chip";
      button.textContent = category;
      button.addEventListener("click", () => {
        moveToQuickExpense(category);
        highlightSelection(els.addCategoryShortcutChips, button);
      });
      els.addCategoryShortcutChips.appendChild(button);
    });
  }
}

function moveToQuickExpense(category) {
  activeView = "add";
  syncViews();
  els.categoryInput.value = category;
  if (!els.titleInput.value.trim()) {
    els.titleInput.value = category;
  }
  highlightMatchingCategoryShortcut(category);
  els.titleInput.focus();
  els.titleInput.setSelectionRange(0, els.titleInput.value.length);
}

function highlightSelection(container, activeButton) {
  [...container.querySelectorAll(".quick-chip, .chip")].forEach((button) => {
    button.classList.toggle("is-selected", button === activeButton);
  });
}

function highlightMatchingCategoryShortcut(category) {
  if (!els.addCategoryShortcutChips) {
    return;
  }
  const match = [...els.addCategoryShortcutChips.querySelectorAll(".quick-chip")].find((button) => button.textContent === category);
  if (match) {
    highlightSelection(els.addCategoryShortcutChips, match);
  }
}

function renderPinnedCategories(expenses) {
  if (!els.pinnedCategoryList) {
    return;
  }
  const top = groupByCategory(expenses).slice(0, 4);
  els.pinnedCategoryList.innerHTML = "";
  if (!top.length) {
    els.pinnedCategoryList.appendChild(emptyState("Pinned categories will appear after a few expenses."));
    return;
  }
  top.forEach((item) => {
    const row = document.createElement("article");
    row.className = "list-item simple-item";
    row.innerHTML = `<div class="list-copy"><div class="item-heading"><h4>${item.category}</h4><span class="chip">${item.count} items</span></div><p class="item-meta">${formatCurrency(item.total)} spent</p></div>`;
    els.pinnedCategoryList.appendChild(row);
  });
}

function renderAccountSnapshot(expenses) {
  if (!els.bankSpendDisplay) {
    return;
  }
  const bankSpend = sum(expenses.filter((item) => item.accountSource === "bank-account" || item.accountSource === "debit-card"));
  const creditSpend = sum(expenses.filter((item) => item.accountSource === "credit-card"));
  const otherSpend = sum(expenses.filter((item) => item.accountSource !== "bank-account" && item.accountSource !== "debit-card" && item.accountSource !== "credit-card"));
  const smsCount = expenses.filter((item) => item.smsImported).length;
  els.bankSpendDisplay.textContent = formatCurrency(bankSpend);
  els.creditSpendDisplay.textContent = formatCurrency(creditSpend);
  els.otherSpendDisplay.textContent = formatCurrency(otherSpend);
  els.smsImportedCountDisplay.textContent = String(smsCount);
  tone(els.bankSpendDisplay, bankSpend > 0 ? "negative" : "positive");
  tone(els.creditSpendDisplay, creditSpend > 0 ? "negative" : "positive");
}

function renderHomeSmsSection(expenses, incomeEntries) {
  const smsExpenses = expenses.filter((item) => item.smsImported);
  const smsIncome = incomeEntries.filter((item) => item.smsImported);
  const allSms = [...smsExpenses, ...smsIncome].sort((a, b) => new Date(b.date) - new Date(a.date));
  const bankCount = smsExpenses.filter((item) => item.accountSource === "bank-account" || item.accountSource === "debit-card").length;
  const creditCount = smsExpenses.filter((item) => item.accountSource === "credit-card").length;
  els.smsImportedCountHomeDisplay.textContent = String(allSms.length);
  els.smsBankCountDisplay.textContent = String(bankCount);
  els.smsCreditCountDisplay.textContent = String(creditCount);
  els.smsLastImportDisplay.textContent = allSms.length ? formatDate(allSms[0].date) : "-";
  els.smsHomeList.innerHTML = "";
  if (!allSms.length) {
    els.smsHomeList.appendChild(emptyState("No SMS-based transactions imported this month yet."));
    return;
  }
  allSms.slice(0, 3).forEach((entry) => {
    const row = document.createElement("article");
    row.className = "list-item simple-item";
    row.innerHTML = `<div class="list-copy"><div class="item-heading"><h4>${entry.title}</h4><span class="chip">${entry.sourceName || accountSourceLabel(entry.accountSource || "other")}</span></div><p class="item-meta">${formatDate(entry.date)} | ${entry.note || "Imported from SMS"}</p></div><div class="list-actions"><strong class="${entry.source ? "positive" : "negative"}">${formatCurrency(entry.amount)}</strong></div>`;
    els.smsHomeList.appendChild(row);
  });
}

function renderBillReminders() {
  if (!els.billReminderList) {
    return;
  }
  const reminders = state.recurringRules
    .filter((item) => item.kind === "expense" && item.active !== false)
    .sort((a, b) => a.day - b.day)
    .slice(0, 5);
  els.billReminderList.innerHTML = "";
  if (!reminders.length) {
    els.billReminderList.appendChild(emptyState("Add recurring rules to see monthly reminders."));
    return;
  }
  reminders.forEach((rule) => {
    const row = document.createElement("article");
    row.className = "list-item simple-item";
    row.innerHTML = `<div class="list-copy"><div class="item-heading"><h4>${rule.title}</h4><span class="chip">Day ${rule.day}</span></div><p class="item-meta">${rule.category} | ${formatCurrency(rule.amount)}</p></div>`;
    els.billReminderList.appendChild(row);
  });
}

function renderRecentExpenses(expenses) {
  renderExpenseCollection(els.recentExpenseList, expenses.slice(0, 3), "No expenses added this month yet.");
}

function renderExpenseList(expenses) {
  renderExpenseCollection(els.expenseList, expenses, "No expenses match the current filters.");
}

function renderExpenseCollection(container, expenses, emptyMessage) {
  container.innerHTML = "";
  if (!expenses.length) {
    container.appendChild(emptyState(emptyMessage));
    return;
  }
  expenses.forEach((entry) => {
    const fragment = els.expenseItemTemplate.content.cloneNode(true);
    const article = fragment.querySelector(".list-item");
    article.dataset.id = entry.id;
    fragment.querySelector("h4").textContent = entry.title;
    fragment.querySelector(".chip").textContent = entry.category;
    fragment.querySelector(".item-meta").textContent = `${formatDate(entry.date)}${entry.smsImported ? " | Imported from SMS" : ""}${entry.sourceName ? ` | ${entry.sourceName}` : ""}`;
    const note = fragment.querySelector(".item-note");
    if (entry.note) {
      note.hidden = false;
      note.textContent = entry.note;
    }
    const amount = fragment.querySelector("strong");
    amount.textContent = formatCurrency(entry.amount);
    amount.classList.add("negative");
    fragment.querySelectorAll("button").forEach((button) => {
      button.dataset.id = entry.id;
      button.dataset.kind = "expense";
    });
    container.appendChild(fragment);
  });
}

function renderIncomeList(entries) {
  els.incomeList.innerHTML = "";
  if (!entries.length) {
    els.incomeList.appendChild(emptyState("No income entries for this month yet."));
    return;
  }
  entries.forEach((entry) => {
    const fragment = els.simpleItemTemplate.content.cloneNode(true);
    fragment.querySelector("h4").textContent = entry.title;
    fragment.querySelector(".chip").textContent = entry.source;
    fragment.querySelector(".item-meta").textContent = `${formatDate(entry.date)}${entry.sourceName ? ` | ${entry.sourceName}` : ""}${entry.smsImported ? " | SMS" : ""}${entry.note ? ` | ${entry.note}` : ""}`;
    const amount = fragment.querySelector("strong");
    amount.textContent = formatCurrency(entry.amount);
    amount.classList.add("positive");
    const button = fragment.querySelector("button");
    button.dataset.kind = "income";
    button.dataset.id = entry.id;
    els.incomeList.appendChild(fragment);
  });
}

function renderCreditExpenseList(entries) {
  const creditEntries = entries.filter((item) => item.accountSource === "credit-card");
  renderExpenseCollection(els.creditExpenseList, creditEntries, "No credit card transactions for this month yet.");
}

function renderSavingsSection(summaries) {
  const totalSavings = summaries.reduce((total, item) => total + item.saved, 0);
  const bestMonth = summaries.reduce((best, item) => (!best || item.saved > best.saved ? item : best), null);
  els.totalSavingsDisplay.textContent = formatCurrency(totalSavings);
  els.trackedMonthsDisplay.textContent = String(summaries.length);
  els.bestMonthDisplay.textContent = bestMonth ? `${shortMonth(bestMonth.monthKey)} ${formatCurrency(bestMonth.saved)}` : "-";
  tone(els.totalSavingsDisplay, totalSavings < 0 ? "negative" : "positive");
  renderSavingsHistory(els.savingsHistoryList, summaries);
}

function renderLastMonth() {
  const monthKey = getRelativeMonthKey(`${selectedMonthKey}-01`, -1);
  const expenses = getExpensesForMonth(state, monthKey);
  const income = getIncomeForMonth(state, monthKey);
  const summary = buildMonthSummary(monthKey, expenses, income);
  els.lastMonthSpentDisplay.textContent = formatCurrency(summary.spent);
  els.lastMonthSavedDisplay.textContent = formatCurrency(summary.saved);
  els.lastMonthCountDisplay.textContent = String(summary.count);
  tone(els.lastMonthSavedDisplay, summary.saved < 0 ? "negative" : "positive");
  els.lastMonthNote.textContent = summary.count
    ? `${formatMonthLabel(monthKey)} closed with ${formatCurrency(summary.saved)} saved.`
    : "No expense history for last month yet.";
}

function handleExpenseActions(event) {
  const button = event.target.closest("button[data-action]");
  const card = event.target.closest(".list-item");
  const targetId = button
    ? button.dataset.id
    : card
      ? card.dataset.id
      : "";
  const entry = state.expenses.find((item) => item.id === targetId);
  if (!entry || (!button && !card)) {
    return;
  }
  if (!button) {
    openEditEntry(entry);
    return;
  }
  if (button.dataset.action === "delete") {
    state.expenses = state.expenses.filter((item) => item.id !== entry.id);
    persist();
    return;
  }
  if (button.dataset.action === "edit") {
    openEditEntry(entry);
    return;
  }
}

function openEditEntry(entry) {
  activeEditId = entry.id;
  if (els.editTitleInput) {
    els.editTitleInput.value = entry.title;
  }
  if (els.editAmountInput) {
    els.editAmountInput.value = entry.amount;
  }
  if (els.editCategoryInput) {
    els.editCategoryInput.value = entry.category;
  }
  if (els.editDateInput) {
    els.editDateInput.value = entry.date;
  }
  if (els.editNoteInput) {
    els.editNoteInput.value = entry.note || "";
  }
  openDialog(els.editDialog);
}

function handleDeleteOnly(event) {
  const button = event.target.closest("button[data-id]");
  if (!button) {
    return;
  }
  const { kind, id } = button.dataset;
  if (kind === "income") {
    state.incomeEntries = state.incomeEntries.filter((item) => item.id !== id);
  } else if (kind === "goal") {
    state.savingsGoals = state.savingsGoals.filter((item) => item.id !== id);
  } else if (kind === "recurring") {
    state.recurringRules = state.recurringRules.filter((item) => item.id !== id);
  } else if (kind === "category-budget") {
    delete state.categoryBudgets[selectedMonthKey][id];
  }
  persist();
}

function getFilteredExpenses(expenses) {
  const query = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;
  const fromDate = els.fromDateFilter.value;
  const toDate = els.toDateFilter.value;

  return expenses.filter((item) => {
    const text = [item.title, item.category, item.note, item.paymentMode, item.sourceName, item.accountSource].join(" ").toLowerCase();
    return (!query || text.includes(query))
      && (!category || item.category === category)
      && (!fromDate || item.date >= fromDate)
      && (!toDate || item.date <= toDate);
  });
}

function buildMonthSummary(monthKey, expenses, incomeEntries) {
  const budget = getBudget(state, monthKey);
  const spent = sum(expenses);
  const income = sum(incomeEntries);
  const base = income > 0 ? income : budget;
  const saved = base - spent;
  return {
    monthKey,
    budget,
    income,
    spent,
    saved,
    remaining: budget - spent,
    usage: budget > 0 ? (spent / budget) * 100 : 0,
    count: expenses.length,
    dailyAverage: spent / Math.max(new Date().getDate(), 1),
  };
}

function groupByCategory(expenses) {
  const total = sum(expenses);
  return Object.entries(
    expenses.reduce((map, item) => {
      if (!map[item.category]) {
        map[item.category] = { category: item.category, total: 0, count: 0 };
      }
      map[item.category].total += item.amount;
      map[item.category].count += 1;
      return map;
    }, {})
  )
    .map(([, value]) => ({
      ...value,
      share: total > 0 ? Math.round((value.total / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

function applyRecurringRules() {
  state.recurringRules.forEach((rule) => {
    if (rule.active === false || rule.startMonth > selectedMonthKey) {
      return;
    }
    const date = `${selectedMonthKey}-${String(rule.day).padStart(2, "0")}`;
    if (rule.kind === "income") {
      const existingIncome = state.incomeEntries.some((item) => item.recurringKey === `${rule.id}-${selectedMonthKey}`);
      if (!existingIncome) {
        state.incomeEntries.push({
          id: createId(),
          title: rule.title,
          amount: rule.amount,
          source: rule.category,
          date,
          note: rule.note,
          recurringKey: `${rule.id}-${selectedMonthKey}`,
          sourceName: "",
          accountSource: "bank-account",
          smsImported: false,
          smsSignature: "",
        });
      }
      return;
    }
    const existingExpense = state.expenses.some((item) => item.recurringKey === `${rule.id}-${selectedMonthKey}`);
    if (!existingExpense) {
      state.expenses.push({
        id: createId(),
        title: rule.title,
        amount: rule.amount,
        category: rule.category,
        date,
        paymentMode: "Bank",
        accountSource: "bank-account",
        sourceName: "",
        expenseType: "need",
        note: rule.note,
        receiptDataUrl: "",
        receiptName: "",
        recurringKey: `${rule.id}-${selectedMonthKey}`,
        smsImported: false,
        smsSignature: "",
      });
    }
  });
  saveState(state);
}

function listMonths() {
  return getMonthOptions(state, selectedMonthKey).sort((a, b) => b.localeCompare(a));
}

function setDefaultDates() {
  const today = toInputDate(new Date());
  if (els.dateInput) {
    els.dateInput.value = today;
  }
  if (els.incomeDateInput) {
    els.incomeDateInput.value = today;
  }
  if (els.recurringStartInput) {
    els.recurringStartInput.value = selectedMonthKey;
  }
}

function resetExpenseForm() {
  els.expenseForm.reset();
  if (els.dateInput) {
    els.dateInput.value = toInputDate(new Date());
  }
  if (els.paymentModeInput) {
    els.paymentModeInput.value = "UPI";
  }
  if (els.accountSourceInput) {
    els.accountSourceInput.value = "bank-account";
  }
  if (els.expenseTypeInput) {
    els.expenseTypeInput.value = "need";
  }
  [...document.querySelectorAll(".quick-chip.is-selected, .chip.is-selected")].forEach((button) => {
    button.classList.remove("is-selected");
  });
}

function syncViews() {
  els.views.forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === activeView);
  });
  els.viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewBtn === activeView);
  });
}

function openDialog(dialog) {
  if (!dialog) {
    return;
  }
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
    return;
  }
  dialog.setAttribute("open", "open");
}

function closeDialog(dialog) {
  if (!dialog) {
    return;
  }
  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }
  dialog.removeAttribute("open");
}

function persist() {
  saveState(state);
  render();
}

function hydrateCloudSettings() {
  if (els.firebaseConfigInput) {
    els.firebaseConfigInput.value = state.cloudSync.firebaseConfigText || "";
  }
  if (els.firebaseDocumentPathInput) {
    els.firebaseDocumentPathInput.value = state.cloudSync.documentPath || "";
  }
}

function renderCloudStatus() {
  if (!els.cloudStatusNote) {
    return;
  }
  if (!state.cloudSync.firebaseConfigText || !state.cloudSync.documentPath) {
    els.cloudStatusNote.textContent = "Cloud sync is not configured yet.";
    return;
  }
  if (state.cloudSync.lastSyncedAt) {
    els.cloudStatusNote.textContent = `Cloud sync is ready. Last synced: ${state.cloudSync.lastSyncedAt}.`;
    return;
  }
  els.cloudStatusNote.textContent = "Cloud sync is configured and ready.";
}

function saveCloudSettings() {
  state.cloudSync.firebaseConfigText = els.firebaseConfigInput.value.trim();
  state.cloudSync.documentPath = els.firebaseDocumentPathInput.value.trim();
  state.cloudSync.lastSyncedAt = "";
  resetCloudContext();
  persist();
  els.cloudStatusNote.textContent = state.cloudSync.firebaseConfigText && state.cloudSync.documentPath
    ? "Cloud setup saved. You can now push or pull your data. Full Firebase config blocks are also supported."
    : "Cloud sync is not configured yet.";
}

async function pushCloudData() {
  try {
    saveCloudSettings();
    await pushCloudState(state);
    saveState(state);
    renderCloudStatus();
  } catch (error) {
    els.cloudStatusNote.textContent = error && error.message ? error.message : "Unable to push data to cloud.";
  }
}

async function pullCloudData() {
  try {
    saveCloudSettings();
    const incoming = await pullCloudState(state, normalizeState);
    replaceState(incoming);
    state.cloudSync.lastSyncedAt = new Date().toLocaleString("en-IN");
    saveState(state);
    render();
    els.cloudStatusNote.textContent = state.cloudSync.lastSyncedAt
      ? `Cloud data loaded. Last synced: ${state.cloudSync.lastSyncedAt}.`
      : "Cloud data loaded successfully.";
  } catch (error) {
    els.cloudStatusNote.textContent = error && error.message ? error.message : "Unable to pull data from cloud.";
  }
}

function replaceState(nextState) {
  Object.keys(state).forEach((key) => {
    delete state[key];
  });
  Object.assign(state, nextState);
  ensureMonthState(state, selectedMonthKey);
  hydrateCloudSettings();
}

function exportCsv() {
  const lines = [
    ["Type", "Title", "Amount", "CategoryOrSource", "Date", "PaymentMode", "AccountType", "AccountName", "NeedOrWant", "ImportedFromSMS", "Note"],
    ...state.expenses.map((item) => ["Expense", item.title, item.amount, item.category, item.date, item.paymentMode || "", accountSourceLabel(item.accountSource || "other"), item.sourceName || "", item.expenseType || "", item.smsImported ? "Yes" : "No", item.note || ""]),
    ...state.incomeEntries.map((item) => ["Income", item.title, item.amount, item.source, item.date, "", accountSourceLabel(item.accountSource || "bank-account"), item.sourceName || "", "", item.smsImported ? "Yes" : "No", item.note || ""]),
  ];
  const csv = lines.map((row) => row.map(csvValue).join(",")).join("\n");
  downloadFile("monthly-budget-report.csv", csv, "text/csv;charset=utf-8");
}

async function shareAppLink() {
  const shareUrl = window.location.href;
  const shareData = {
    title: "Monthly Budget",
    text: "Track your monthly budget and expenses with this app.",
    url: shareUrl,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      els.shareAppStatus.textContent = "App link shared successfully.";
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      els.shareAppStatus.textContent = "App link copied to clipboard.";
      return;
    }
  } catch (error) {
    els.shareAppStatus.textContent = "Share was cancelled or unavailable. You can still copy the link from the browser address bar.";
    return;
  }

  els.shareAppStatus.textContent = "Sharing is not supported here. Copy the link from the browser address bar.";
}

function previewSmsImports() {
  smsPreviewEntries = buildSmsPreviewEntries(els.smsImportInput.value);
  if (!smsPreviewEntries.length) {
    els.smsImportStatus.textContent = "No valid bank or card SMS was detected. Paste complete transaction messages with an amount like INR 1,250.";
  } else {
    const importableCount = smsPreviewEntries.filter((item) => item.status === "ready").length;
    const suspiciousCount = smsPreviewEntries.filter((item) => item.parsed && item.parsed.suspicious).length;
    els.smsImportStatus.textContent = `${smsPreviewEntries.length} bank SMS parsed. ${importableCount} ready to import.${suspiciousCount ? ` ${suspiciousCount} suspicious message${suspiciousCount === 1 ? "" : "s"} need review.` : ""} OTP and non-bank messages are ignored.`;
  }
  renderSmsPreview();
}

function importSmsEntries() {
  if (!smsPreviewEntries.length) {
    previewSmsImports();
  }
  if (!smsPreviewEntries.length) {
    return;
  }

  let imported = 0;
  smsPreviewEntries.forEach((item) => {
    if (item.status !== "ready" || !item.parsed) {
      return;
    }
    saveParsedSmsEntry(item.parsed);
    item.status = "imported";
    imported += 1;
  });

  els.smsImportStatus.textContent = imported
    ? `${imported} SMS transaction${imported === 1 ? "" : "s"} imported successfully.`
    : "No new SMS transaction was imported. Duplicates were skipped.";
  els.smsImportInput.value = "";
  smsPreviewEntries = [];
  persist();
}

function renderSmsPreview() {
  els.smsImportList.innerHTML = "";
  if (!smsPreviewEntries.length) {
    els.smsImportList.appendChild(emptyState("Paste SMS alerts here to preview what will be imported."));
    return;
  }
  smsPreviewEntries.forEach((item) => {
    const row = document.createElement("article");
    row.className = "list-item simple-item";
    if (!item.parsed) {
      row.innerHTML = `<div class="list-copy"><div class="item-heading"><h4>Skipped</h4><span class="chip">Not detected</span></div><p class="item-meta">${item.raw}</p></div>`;
      els.smsImportList.appendChild(row);
      return;
    }
    const chipLabel = item.status === "duplicate"
      ? "Duplicate"
      : item.parsed.suspicious
        ? "Review"
        : item.parsed.kind === "income"
          ? "Income"
          : accountSourceLabel(item.parsed.accountSource);
    row.innerHTML = `<div class="list-copy"><div class="item-heading"><h4>${item.parsed.title}</h4><span class="chip">${chipLabel}</span></div><p class="item-meta">${formatDate(item.parsed.date)} | ${item.parsed.sourceName || item.parsed.source || item.parsed.category}${item.parsed.sender ? ` | ${item.parsed.sender}` : ""}</p></div><div class="list-actions"><strong class="${item.parsed.kind === "income" ? "positive" : "negative"}">${formatCurrency(item.parsed.amount)}</strong></div>`;
    els.smsImportList.appendChild(row);
  });
}

function buildSmsPreviewEntries(text) {
  return splitSmsBlocks(text).map((raw) => {
    const parsed = parseSmsMessage(raw);
    if (!parsed) {
      return { raw, parsed: null, status: "invalid" };
    }
    const isDuplicate = hasSmsDuplicate(parsed.smsSignature);
    return { raw, parsed, status: isDuplicate ? "duplicate" : "ready" };
  });
}

function autoImportTrustedSms(messages) {
  let imported = 0;
  messages.forEach((item) => {
    const parsed = parseSmsMessage(item);
    if (!parsed || !parsed.autoImportEligible || hasSmsDuplicate(parsed.smsSignature)) {
      return;
    }
    saveParsedSmsEntry(parsed);
    imported += 1;
  });
  if (imported) {
    persist();
  }
  return imported;
}

function saveParsedSmsEntry(parsed) {
  if (parsed.kind === "income") {
    state.incomeEntries.unshift({
      id: createId(),
      title: parsed.title,
      amount: parsed.amount,
      source: parsed.source,
      date: parsed.date,
      note: parsed.note,
      recurringKey: "",
      sourceName: parsed.sourceName,
      accountSource: parsed.accountSource,
      smsImported: true,
      smsSignature: parsed.smsSignature,
    });
    return;
  }
  state.expenses.unshift({
    id: createId(),
    title: parsed.title,
    amount: parsed.amount,
    category: parsed.category,
    date: parsed.date,
    paymentMode: parsed.paymentMode,
    accountSource: parsed.accountSource,
    sourceName: parsed.sourceName,
    expenseType: "need",
    note: parsed.note,
    receiptDataUrl: "",
    receiptName: "",
    recurringKey: "",
    smsImported: true,
    smsSignature: parsed.smsSignature,
  });
}

function splitSmsBlocks(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    return [];
  }
  const blocks = trimmed.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  if (blocks.length > 1) {
    return blocks;
  }
  return trimmed.split("\n").map((item) => item.trim()).filter(Boolean);
}

function hasSmsDuplicate(signature) {
  return state.expenses.some((item) => item.smsSignature === signature)
    || state.incomeEntries.some((item) => item.smsSignature === signature);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
