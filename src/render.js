import {
  COLORS,
  emptyState,
  escapeAttribute,
  escapeHtml,
  formatCurrency,
  formatDate,
  formatMonthLabel,
  getDaysInMonth,
  getWeeksInMonth,
  shortMonth,
  tone,
} from "./helpers.js";

export function renderMonthFilter(select, monthOptions, selectedMonthKey) {
  select.innerHTML = "";
  monthOptions.forEach((monthKey) => {
    const option = document.createElement("option");
    option.value = monthKey;
    option.textContent = formatMonthLabel(monthKey);
    option.selected = monthKey === selectedMonthKey;
    select.appendChild(option);
  });
}

export function renderCategoryFilter(select, expenses) {
  const currentValue = select.value;
  const categories = ["", ...new Set(expenses.map((item) => item.category))];
  select.innerHTML = "";
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category || "All categories";
    option.selected = category === currentValue;
    select.appendChild(option);
  });
}

export function renderSummary(els, summary) {
  els.selectedMonthTitle.textContent = formatMonthLabel(summary.monthKey);
  els.budgetDisplay.textContent = formatCurrency(summary.budget);
  els.incomeDisplay.textContent = formatCurrency(summary.income);
  els.spentDisplay.textContent = formatCurrency(summary.spent);
  els.savedDisplay.textContent = formatCurrency(summary.saved);
  els.countDisplay.textContent = String(summary.count);
  els.dailyAverageDisplay.textContent = formatCurrency(summary.dailyAverage);
  els.progressText.textContent = `${Math.round(summary.usage)}%`;
  els.progressFill.style.width = `${summary.usage}%`;
  tone(els.incomeDisplay, "positive");
  tone(els.spentDisplay, "negative");
  tone(els.savedDisplay, summary.saved < 0 ? "negative" : "positive");
  if (summary.usage >= 100 || summary.saved < 0) {
    els.alertBadge.textContent = "Budget exceeded";
    els.alertBadge.className = "badge negative-bg";
  } else if (summary.usage >= 80) {
    els.alertBadge.textContent = "Budget warning";
    els.alertBadge.className = "badge warning-bg";
  } else {
    els.alertBadge.textContent = "Healthy month";
    els.alertBadge.className = "badge positive-bg";
  }
}

export function renderAlerts(container, summary, groupedCategories, categoryBudgets) {
  container.innerHTML = "";
  const alerts = [];
  if (summary.usage >= 100) {
    alerts.push(["negative-bg", "Budget alert: spending has crossed 100% of the monthly budget."]);
  } else if (summary.usage >= 80) {
    alerts.push(["warning-bg", "Budget alert: spending has crossed 80% of the monthly budget."]);
  } else if (summary.usage >= 50) {
    alerts.push(["warning-bg", "Budget alert: spending has crossed 50% of the monthly budget."]);
  } else {
    alerts.push(["positive-bg", "Budget alert: spending is still below 50% of the monthly budget."]);
  }
  groupedCategories.forEach((item) => {
    const limit = categoryBudgets[item.category];
    if (limit && item.total > limit) {
      alerts.push(["negative-bg", `${item.category} is over category budget by ${formatCurrency(item.total - limit)}.`]);
    }
  });
  alerts.forEach(([toneClass, text]) => {
    const node = document.createElement("div");
    node.className = `alert-item ${toneClass}`;
    node.textContent = text;
    container.appendChild(node);
  });
}

export function renderInsights(els, summary, groupedCategories, expenses) {
  const biggestExpense = expenses.reduce((max, item) => (!max || item.amount > max.amount ? item : max), null);
  const weeklyAverage = Math.round(summary.spent / Math.max(getWeeksInMonth(summary.monthKey), 1));
  const expectedSpend = Math.round(summary.dailyAverage * getDaysInMonth(summary.monthKey));
  const topCategory = groupedCategories[0];
  els.highestCategoryDisplay.textContent = topCategory ? `${topCategory.category} ${formatCurrency(topCategory.total)}` : "-";
  els.biggestExpenseDisplay.textContent = biggestExpense ? `${biggestExpense.title} ${formatCurrency(biggestExpense.amount)}` : "-";
  els.weeklyAverageDisplay.textContent = formatCurrency(weeklyAverage);
  els.expectedSpendDisplay.textContent = formatCurrency(expectedSpend);
  tone(els.expectedSpendDisplay, expectedSpend > summary.budget ? "negative" : "positive");
}

export function renderTrend(container, summaries) {
  container.innerHTML = "";
  if (!summaries.length) {
    container.appendChild(emptyState("Trend chart will appear after you add data."));
    return;
  }
  const values = [];
  summaries.forEach((item) => {
    values.push(item.spent, Math.max(item.saved, 0));
  });
  const maxValue = Math.max(...values, 1);
  summaries.forEach((item) => {
    const node = document.createElement("div");
    node.className = "trend-row";
    node.innerHTML = `
      <div class="trend-meta">
        <strong>${escapeHtml(shortMonth(item.monthKey))}</strong>
        <span>Spent ${formatCurrency(item.spent)} | Saved ${formatCurrency(item.saved)}</span>
      </div>
      <div class="trend-bars">
        <div class="trend-bar-track"><div class="trend-bar spent" style="width:${(item.spent / maxValue) * 100}%"></div></div>
        <div class="trend-bar-track"><div class="trend-bar saved" style="width:${(Math.max(item.saved, 0) / maxValue) * 100}%"></div></div>
      </div>
    `;
    container.appendChild(node);
  });
}

export function renderCategoryChart(donut, legend, groupedCategories) {
  legend.innerHTML = "";
  if (!groupedCategories.length) {
    donut.style.background = "conic-gradient(#dbe6f6 0 100%)";
    legend.appendChild(emptyState("Category split appears after you add expenses."));
    return;
  }
  let start = 0;
  const segments = [];
  groupedCategories.forEach((item, index) => {
    const color = COLORS[index % COLORS.length];
    const end = start + item.share;
    segments.push(`${color} ${start}% ${end}%`);
    start = end;
    const node = document.createElement("div");
    node.className = "legend-item";
    node.innerHTML = `<span class="legend-swatch" style="background:${color}"></span><span>${escapeHtml(item.category)} ${formatCurrency(item.total)} (${item.share}%)</span>`;
    legend.appendChild(node);
  });
  donut.style.background = `conic-gradient(${segments.join(", ")})`;
}

export function renderCategorySpend(container, groupedCategories) {
  container.innerHTML = "";
  if (!groupedCategories.length) {
    container.appendChild(emptyState("Category totals will appear after you add expenses."));
    return;
  }
  groupedCategories.forEach((item) => {
    const row = document.createElement("article");
    row.className = "category-row";
    row.innerHTML = `
      <div class="category-top">
        <strong>${escapeHtml(item.category)}</strong>
        <span>${formatCurrency(item.total)}</span>
      </div>
      <div class="mini-track"><div class="mini-fill" style="width:${item.share}%"></div></div>
      <span class="item-meta">${item.share}% of month spend</span>
    `;
    container.appendChild(row);
  });
}

export function renderTransactionList(container, template, entries, kind) {
  container.innerHTML = "";
  if (!entries.length) {
    container.appendChild(emptyState(kind === "income" ? "No income entries for this month yet." : "No expenses match the current filters."));
    return;
  }
  entries.forEach((entry) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector("h4").textContent = entry.title;
    fragment.querySelector(".chip").textContent = kind === "expense" ? entry.category : entry.source;
    fragment.querySelector(".item-meta").textContent = `${formatDate(entry.date)}${entry.recurringKey ? " | Recurring" : ""}`;
    const note = fragment.querySelector(".item-note");
    if (entry.note) {
      note.hidden = false;
      note.textContent = entry.note;
    }
    const amount = fragment.querySelector("strong");
    amount.textContent = formatCurrency(entry.amount);
    amount.classList.add(kind === "expense" ? "negative" : "positive");
    fragment.querySelectorAll("button").forEach((button) => {
      button.dataset.id = entry.id;
      button.dataset.kind = kind;
    });
    container.appendChild(fragment);
  });
}

export function renderRecurringList(container, template, rules) {
  container.innerHTML = "";
  if (!rules.length) {
    container.appendChild(emptyState("Add a recurring rule to automate monthly entries."));
    return;
  }
  rules.forEach((rule) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector("h4").textContent = rule.title;
    fragment.querySelector(".chip").textContent = rule.kind === "income" ? "Recurring income" : "Recurring expense";
    fragment.querySelector(".item-meta").textContent = `Starts ${formatMonthLabel(rule.startMonth)} | Day ${rule.day} | ${rule.category}`;
    const amount = fragment.querySelector("strong");
    amount.textContent = formatCurrency(rule.amount);
    amount.classList.add(rule.kind === "income" ? "positive" : "negative");
    const button = fragment.querySelector("button");
    button.dataset.kind = "recurring";
    button.dataset.id = rule.id;
    container.appendChild(fragment);
  });
}

export function renderCategoryBudgets(container, monthKey, budgets, groupedCategories) {
  container.innerHTML = "";
  const names = Object.keys(budgets);
  if (!names.length) {
    container.appendChild(emptyState("No category budgets set for this month."));
    return;
  }
  names.forEach((name) => {
    const budget = budgets[name];
    const match = groupedCategories.find((item) => item.category === name);
    const spent = match ? match.total : 0;
    const remaining = budget - spent;
    const node = document.createElement("article");
    node.className = "category-budget-item";
    node.innerHTML = `
      <div class="goal-top">
        <div>
          <strong>${escapeHtml(name)}</strong>
          <p class="item-meta">Spent ${formatCurrency(spent)} of ${formatCurrency(budget)}</p>
        </div>
        <div class="${remaining < 0 ? "negative" : "positive"}">${formatCurrency(remaining)} ${remaining < 0 ? "over" : "left"}</div>
      </div>
      <div class="goal-progress"><div class="goal-progress-fill" style="width:${Math.min((spent / budget) * 100, 100)}%"></div></div>
      <div class="toolbar">
        <span class="hint-text">Category budget for ${formatMonthLabel(monthKey)}</span>
        <button class="icon-btn" type="button" data-kind="category-budget" data-id="${escapeAttribute(name)}">Delete</button>
      </div>
    `;
    container.appendChild(node);
  });
}

export function renderGoals(container, goals, totalSavings) {
  container.innerHTML = "";
  if (!goals.length) {
    container.appendChild(emptyState(`No savings goals yet. Total savings currently ${formatCurrency(totalSavings)}.`));
    return;
  }
  goals.forEach((goal) => {
    const percent = Math.min((goal.saved / goal.target) * 100, 100);
    const node = document.createElement("article");
    node.className = "goal-card";
    node.innerHTML = `
      <div class="goal-top">
        <div>
          <strong>${escapeHtml(goal.name)}</strong>
          <p class="item-meta">${goal.deadline ? `Deadline ${formatDate(goal.deadline)}` : "No deadline set"}</p>
        </div>
        <div class="${goal.saved >= goal.target ? "positive" : ""}">${formatCurrency(goal.saved)} / ${formatCurrency(goal.target)}</div>
      </div>
      <div class="goal-progress"><div class="goal-progress-fill" style="width:${percent}%"></div></div>
      <p class="item-note">${escapeHtml(goal.note || "No note added.")}</p>
      <div class="toolbar">
        <span class="hint-text">${Math.round(percent)}% complete</span>
        <button class="icon-btn" type="button" data-kind="goal" data-id="${goal.id}">Delete</button>
      </div>
    `;
    container.appendChild(node);
  });
}

export function renderSavingsHistory(container, summaries) {
  container.innerHTML = "";
  if (!summaries.length) {
    container.appendChild(emptyState("Monthly savings history will appear once you add data."));
    return;
  }
  summaries.forEach((item) => {
    const node = document.createElement("article");
    node.className = "list-item";
    node.innerHTML = `
      <div class="list-copy">
        <div class="item-heading"><h4>${escapeHtml(formatMonthLabel(item.monthKey))}</h4><span class="chip">${item.count} expenses</span></div>
        <p class="item-meta">Income ${formatCurrency(item.income)} | Spent ${formatCurrency(item.spent)} | Budget ${formatCurrency(item.budget)}</p>
      </div>
      <div class="list-actions"><strong class="${item.saved < 0 ? "negative" : "positive"}">${formatCurrency(item.saved)}</strong></div>
    `;
    container.appendChild(node);
  });
}
