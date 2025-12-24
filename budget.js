const state = {
  goals: [],
  habits: [],
};

const selectors = {
  goalsList: document.getElementById("goals-list"),
  habitsList: document.getElementById("habits-list"),
  habitTotal: document.getElementById("habit-total"),
  habitCount: document.getElementById("habit-count"),
  insightsList: document.getElementById("insights-list"),
  categoryBudgetsContainer: document.getElementById("category-budgets-container"),
  summary: {
    budget: document.getElementById("metric-budget"),
    income: document.getElementById("metric-income"),
    expense: document.getElementById("metric-expense"),
    savings: document.getElementById("metric-savings"),
  },
  saveBtn: document.getElementById("save-preferences"),
  refreshBtn: document.getElementById("refresh-summary"),
};

const user = JSON.parse(localStorage.getItem("user"));
if (!user || !user.id) {
  alert("אין משתמש מחובר, נא להתחבר.");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("goal-form")?.addEventListener("submit", handleGoalSubmit);
  document.getElementById("habit-form")?.addEventListener("submit", handleHabitSubmit);
  selectors.saveBtn?.addEventListener("click", savePreferences);
  selectors.refreshBtn?.addEventListener("click", () => loadBudgetSummary(true));
  document.addEventListener("click", handleChipActions);

  loadPreferences();
  loadBudgetSummary();
});

function handleGoalSubmit(e) {
  e.preventDefault();
  const category = document.getElementById("goal-category").value.trim();
  const goal = document.getElementById("goal-type").value;

  if (!category) {
    return showToast("נא להזין שם קטגוריה", "error");
  }

  const existingIndex = state.goals.findIndex(
    (g) => g.category.toLowerCase() === category.toLowerCase()
  );

  if (existingIndex >= 0) {
    state.goals[existingIndex].goal = goal;
    showToast("היעד עודכן בהצלחה", "success");
  } else {
    state.goals.push({ category, goal });
    showToast("היעד נוסף בהצלחה", "success");
  }

  e.target.reset();
  renderGoals();
}

function handleHabitSubmit(e) {
  e.preventDefault();
  const description = document.getElementById("habit-desc").value.trim();
  const amount = Number(document.getElementById("habit-amount").value);
  const frequency = document.getElementById("habit-frequency").value;

  if (!description || !amount || amount <= 0) {
    return showToast("נא להזין תיאור וסכום חיובי", "error");
  }

  state.habits.push({ description, amount, frequency });
  e.target.reset();
  renderHabits();
  showToast("ההרגל נוסף לרשימה", "success");
}

function handleChipActions(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const index = Number(button.dataset.index);
  if (button.dataset.action === "remove-goal") {
    state.goals.splice(index, 1);
    renderGoals();
    showToast("היעד הוסר", "success");
  }
  if (button.dataset.action === "remove-habit") {
    state.habits.splice(index, 1);
    renderHabits();
    showToast("ההרגל הוסר", "success");
  }
}

function renderGoals() {
  const container = selectors.goalsList;
  if (!container) return;

  if (!state.goals.length) {
    container.classList.add("empty-state");
    container.innerHTML = `
      <p><i class="fas fa-info-circle"></i> עדיין לא הוגדרו יעדים. הוסף יעד כדי להתחיל לקבל התאמות.</p>
    `;
    return;
  }

  container.classList.remove("empty-state");
  container.innerHTML = state.goals
    .map(
      (goal, index) => `
      <div class="chip goal-chip">
        <div class="chip-body">
          <p class="chip-title">${goal.category}</p>
          <span class="chip-subtitle">${getGoalLabel(goal.goal)}</span>
        </div>
        <button class="icon-btn" data-action="remove-goal" data-index="${index}" aria-label="מחק יעד">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `
    )
    .join("");
}

function renderHabits() {
  const container = selectors.habitsList;
  if (!container) return;

  if (!state.habits.length) {
    container.classList.add("empty-state");
    container.innerHTML = `
      <p><i class="fas fa-info-circle"></i> הוסף הרגלים קבועים כדי לראות את העלות החודשית שלהם.</p>
    `;
    updateHabitStats();
    return;
  }

  container.classList.remove("empty-state");
  container.innerHTML = state.habits
    .map((habit, index) => {
      const monthlyCost = calculateMonthlyCost(habit);
      return `
        <div class="chip habit-chip">
          <div class="chip-body">
            <p class="chip-title">${habit.description}</p>
            <span class="chip-subtitle">${habit.amount} ₪ • ${getFrequencyLabel(habit.frequency)}</span>
          </div>
          <span class="chip-badge">${monthlyCost.toLocaleString()} ₪ לחודש</span>
          <button class="icon-btn" data-action="remove-habit" data-index="${index}" aria-label="מחק הרגל">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
    })
    .join("");

  updateHabitStats();
}

function updateHabitStats() {
  const total = state.habits.reduce(
    (sum, habit) => sum + calculateMonthlyCost(habit),
    0
  );
  selectors.habitTotal.textContent = `₪${total.toLocaleString()}`;
  selectors.habitCount.textContent = state.habits.length;
}

function calculateMonthlyCost(habit) {
  const amount = Number(habit.amount) || 0;
  switch (habit.frequency) {
    case "daily":
      return Math.round(amount * 30);
    case "weekly":
      return Math.round(amount * 4);
    default:
      return Math.round(amount);
  }
}

function savePreferences() {
  selectors.saveBtn?.classList.add("loading");
  fetch("http://localhost:3000/budget-preferences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.id, goals: state.goals, habits: state.habits }),
  })
    .then((res) => res.json())
    .then((data) => {
      showToast(data.message || "העדפות נשמרו בהצלחה", "success");
      loadBudgetSummary();
    })
    .catch((error) => {
      console.error("שגיאה בשמירת העדפות:", error);
      showToast("שגיאה בשמירה לשרת", "error");
    })
    .finally(() => selectors.saveBtn?.classList.remove("loading"));
}

function loadPreferences() {
  fetch(`http://localhost:3000/budget-preferences/${user.id}`)
    .then((res) => res.json())
    .then((data) => {
      const preferences = data.preferences || { goals: [], habits: [] };
      state.goals = preferences.goals || [];
      state.habits = preferences.habits || [];
      renderGoals();
      renderHabits();
    })
    .catch((error) => {
      console.error("שגיאה בטעינת העדפות:", error);
      showToast("שגיאה בטעינת ההעדפות מהשרת", "error");
    });
}

function loadBudgetSummary(showFeedback = false) {
  setSummaryLoading(true);
  fetch(`http://localhost:3000/budget-summary/${user.id}`)
    .then((res) => res.json())
    .then((data) => {
      if (!data.success || !data.summary) {
        throw new Error("Invalid summary response");
      }
      renderSummary(data.summary);
      if (showFeedback) {
        showToast("התקציב רוענן בהצלחה", "success");
      }
    })
    .catch((error) => {
      console.error("שגיאה בשליפת תקציב:", error);
      showToast("לא הצלחנו לטעון את התקציב החכם", "error");
      renderSummary();
    })
    .finally(() => setSummaryLoading(false));
}

function renderSummary(summary = {}) {
  const {
    totalBudget = 0,
    categoryBudgets = [],
    expectedIncome = 0,
    expectedSavings = 0,
    notes = [],
  } = summary;

  // עדכון הכרטיסים הקיימים
  selectors.summary.budget.textContent = formatCurrency(totalBudget);
  selectors.summary.income.textContent = formatCurrency(expectedIncome);
  selectors.summary.expense.textContent = formatCurrency(totalBudget);
  selectors.summary.savings.textContent = formatCurrency(expectedSavings);

  // הצגת תקציבים לפי קטגוריה
  renderCategoryBudgets(categoryBudgets);

  // יצירת תובנות
  const insights = [];
  if (expectedSavings >= 0) {
    insights.push({
      icon: expectedSavings > 0 ? "fa-face-smile" : "fa-face-meh",
      text:
        expectedSavings > 0
          ? `חיסכון צפוי של ${formatCurrency(expectedSavings)}. המשך כך!`
          : "המאזן מאוזן, בחן אם ניתן לשפר את החיסכון.",
    });
  }

  if (notes.length) {
    notes.forEach((note) =>
      insights.push({ icon: "fa-lightbulb", text: note })
    );
  }

  renderInsights(insights);
}

function renderCategoryBudgets(categoryBudgets) {
  const container = selectors.categoryBudgetsContainer;
  if (!container) return;

  if (!categoryBudgets || categoryBudgets.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p><i class="fas fa-info-circle"></i> אין קטגוריות עם הוצאות. הוסף הוצאות כדי לראות תקציב מומלץ לפי קטגוריה.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="category-budgets-table">
      <div class="table-header">
        <div class="col-category">קטגוריה</div>
        <div class="col-budget">תקציב מומלץ</div>
        <div class="col-average">ממוצע הוצאות</div>
        <div class="col-transactions">תנועות</div>
        <div class="col-progress">השוואה</div>
      </div>
      <div class="table-body">
        ${categoryBudgets.map(cat => `
          <div class="table-row">
            <div class="col-category">
              <strong>${cat.category}</strong>
            </div>
            <div class="col-budget">
              <span class="budget-value">${formatCurrency(cat.budget)}</span>
            </div>
            <div class="col-average">
              <span class="average-value">${formatCurrency(cat.averageExpense)}</span>
            </div>
            <div class="col-transactions">
              <span class="transactions-count">${cat.transactions}</span>
            </div>
            <div class="col-progress">
              <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${Math.min(100, (cat.budget / (cat.averageExpense || 1)) * 100)}%"></div>
              </div>
              <span class="progress-text">${cat.budget > cat.averageExpense ? '+' : ''}${Math.round(((cat.budget - cat.averageExpense) / (cat.averageExpense || 1)) * 100)}%</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderInsights(items) {
  if (!selectors.insightsList) return;

  if (!items.length) {
    selectors.insightsList.innerHTML =
      '<li class="insight-row muted">אין מספיק נתונים כדי להציג תובנות כרגע.</li>';
    return;
  }

  selectors.insightsList.innerHTML = items
    .map(
      (item) => `
        <li class="insight-row">
          <i class="fas ${item.icon}"></i>
          <span>${item.text}</span>
        </li>
      `
    )
    .join("");
}

function setSummaryLoading(isLoading) {
  Object.values(selectors.summary).forEach((el) => {
    if (!el) return;
    if (isLoading) {
      el.textContent = "…";
    }
  });
  if (isLoading && selectors.categoryBudgetsContainer) {
    selectors.categoryBudgetsContainer.innerHTML = `
      <div class="empty-state">
        <p><i class="fas fa-spinner fa-spin"></i> טוען תקציבים לפי קטגוריה...</p>
      </div>
    `;
  }
}

function formatCurrency(value) {
  return `₪${Number(value || 0).toLocaleString()}`;
}

function getGoalLabel(goal) {
  switch (goal) {
    case "less":
      return "להוציא פחות";
    case "more":
      return "להשקיע יותר";
    default:
      return "לשמור על הקיים";
  }
}

function getFrequencyLabel(freq) {
  switch (freq) {
    case "daily":
      return "יומי";
    case "weekly":
      return "שבועי";
    case "monthly":
      return "חודשי";
    default:
      return "";
  }
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas fa-${
      type === "success"
        ? "check-circle"
        : type === "error"
        ? "exclamation-circle"
        : "info-circle"
    }"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}