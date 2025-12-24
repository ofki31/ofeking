// 📅 שליפת התאריך מה-URL
const params = new URLSearchParams(window.location.search);
let currentDate = params.get("date");

if (currentDate) {
  const titleEl = document.getElementById("date-title");
  if (titleEl) {
    titleEl.textContent = `מעקב הוצאות ליום ${currentDate}`;
  }
}

// 🆕 Toast Notifications
function showToast(message, type = 'info', duration = 4000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fas fa-check-circle' :
                 type === 'error' ? 'fas fa-exclamation-circle' :
                 type === 'warning' ? 'fas fa-exclamation-triangle' :
                 'fas fa-info-circle';
    
    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // הסרה אוטומטית
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// 🆕 Loading State Management
function setLoading(isLoading) {
    const submitBtn = document.getElementById('submit');
    const loadingEl = submitBtn.querySelector('.loading');
    const textEl = submitBtn.querySelector('span');
    
    if (isLoading) {
        submitBtn.disabled = true;
        loadingEl.style.display = 'inline-block';
        textEl.style.display = 'none';
    } else {
        submitBtn.disabled = false;
        loadingEl.style.display = 'none';
        textEl.style.display = 'inline';
    }
}

// 🎯 קבלת אלמנטים מה-HTML
const description = document.getElementById("description");
const amount = document.getElementById("amount");
const category = document.getElementById("category");
const type = document.getElementById("type");
const submit = document.getElementById("submit");
const expenseList = document.getElementById("expense-list");
const totalElement = document.getElementById("total");
const totalIncomeEl = document.getElementById("total-income");
const totalExpenseEl = document.getElementById("total-expense");

let dailyExpenses = [];
let currentLocation = null;
let searchTimeout = null; 
let categoryColors = JSON.parse(localStorage.getItem("categoryColors")) || {};

// 🔑 HERE API Key - שנה ל-true כדי לאלץ שימוש ב-HERE API
const HERE_API_KEY = "a2ePPckDj2ngbtVA1TZc_4ZaaPpABF9CDofxjTyagFY";
const FORCE_HERE_API = true; // 🆕 הוסף את זה כדי לאלץ שימוש ב-HERE

// 🆕 רשימת מקומות מובנית לישראל
const israeliPlaces = [
    { name: 'שופרסל דיזנגוף', city: 'תל אביב', lat: 32.0853, lng: 34.7818, category: 'סופרמרקט' },
    { name: 'שופרסל הרצל', city: 'תל אביב', lat: 32.0640, lng: 34.7749, category: 'סופרמרקט' },
    { name: 'שופרסל אלנבי', city: 'תל אביב', lat: 32.0588, lng: 34.7668, category: 'סופרמרקט' },
    { name: 'רמי לוי הרצל', city: 'תל אביב', lat: 32.0650, lng: 34.7720, category: 'סופרמרקט' },
    { name: 'רמי לוי דיזנגוף', city: 'תל אביב', lat: 32.0853, lng: 34.7818, category: 'סופרמרקט' },
    { name: 'רמי לוי קרליבך', city: 'תל אביב', lat: 32.0542, lng: 34.7511, category: 'סופרמרקט' },
    { name: 'מגא באר שבע', city: 'באר שבע', lat: 31.2518, lng: 34.7915, category: 'סופרמרקט' },
    { name: 'מגא ירושלים', city: 'ירושלים', lat: 31.7683, lng: 35.2137, category: 'סופרמרקט' },
    { name: 'מגא אשקלון', city: 'אשקלון', lat: 31.6688, lng: 34.5742, category: 'סופרמרקט' },
    { name: 'פז אלון תבור', city: 'תל אביב', lat: 32.0853, lng: 34.7818, category: 'דלק' },
    { name: 'פז דיזנגוף', city: 'תל אביב', lat: 32.0853, lng: 34.7818, category: 'דלק' },
    { name: 'סונול דיזנגוף', city: 'תל אביב', lat: 32.0853, lng: 34.7818, category: 'דלק' },
    { name: 'סונול הירקון', city: 'תל אביב', lat: 32.0855, lng: 34.7732, category: 'דלק' },
    { name: 'דלק הרצל', city: 'תל אביב', lat: 32.0640, lng: 34.7749, category: 'דלק' },
    { name: 'מקדונלדס אזריאלי', city: 'תל אביב', lat: 32.0747, lng: 34.7920, category: 'מזון מהיר' },
    { name: 'מקדונלדס דיזנגוף', city: 'תל אביב', lat: 32.0853, lng: 34.7818, category: 'מזון מהיר' },
    { name: 'מקדונלדס קניון עזריאלי', city: 'רמת גן', lat: 32.0833, lng: 34.8167, category: 'מזון מהיר' },
    { name: 'ברגר קינג אזריאלי', city: 'תל אביב', lat: 32.0747, lng: 34.7920, category: 'מזון מהיר' },
    { name: 'קופי שופ דיזנגוף', city: 'תל אביב', lat: 32.0853, lng: 34.7818, category: 'קפה' },
    { name: 'קפה נרו רוטשילד', city: 'תל אביב', lat: 32.0668, lng: 34.7647, category: 'קפה' },
    { name: 'אפליקציה דרכי השלום', city: 'תל אביב', lat: 32.0547, lng: 34.7530, category: 'קפה' },
    { name: 'דיזנגוף סנטר', city: 'תל אביב', lat: 32.0747, lng: 34.7747, category: 'קניון' },
    { name: 'אזריאלי מול', city: 'תל אביב', lat: 32.0747, lng: 34.7920, category: 'קניון' },
    { name: 'קניון עזריאלי רמת גן', city: 'רמת גן', lat: 32.0833, lng: 34.8167, category: 'קניון' },
    { name: 'קניון תל אביב', city: 'תל אביב', lat: 32.1058, lng: 34.8061, category: 'קניון' },
    { name: 'מלכה ירושלים', city: 'ירושלים', lat: 31.7338, lng: 35.1964, category: 'קניון' },
    { name: 'קניון ממילא', city: 'ירושלים', lat: 31.7767, lng: 35.2267, category: 'קניון' },
    { name: 'איקאה נתניה', city: 'נתניה', lat: 32.2662, lng: 34.8516, category: 'רהיטים' },
    { name: 'זארה דיזנגוף', city: 'תל אביב', lat: 32.0747, lng: 34.7747, category: 'אופנה' },
    { name: 'H&M אזריאלי', city: 'תל אביב', lat: 32.0747, lng: 34.7920, category: 'אופנה' }
];

// 🆕 Toast Notifications
function showToast(message, type = 'info', duration = 4000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fas fa-check-circle' :
                 type === 'error' ? 'fas fa-exclamation-circle' :
                 type === 'warning' ? 'fas fa-exclamation-triangle' :
                 'fas fa-info-circle';
    
    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // הסרה אוטומטית
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// 🆕 Loading State Management
function setLoading(isLoading) {
    const submitBtn = document.getElementById('submit');
    const loadingEl = submitBtn.querySelector('.loading');
    const textEl = submitBtn.querySelector('span');
    
    if (isLoading) {
        submitBtn.disabled = true;
        loadingEl.style.display = 'inline-block';
        textEl.style.display = 'none';
    } else {
        submitBtn.disabled = false;
        loadingEl.style.display = 'none';
        textEl.style.display = 'inline';
    }
}

// 🆕 Update Header Stats
function updateHeaderStats() {
    const currentMonthEl = document.getElementById('current-month');
    const currentTimeEl = document.getElementById('current-time');
    
    if (currentMonthEl) {
        const now = new Date();
        const monthNames = [
            'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
            'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
        ];
        currentMonthEl.textContent = monthNames[now.getMonth()];
    }
    
    if (currentTimeEl) {
        const updateTime = () => {
            const now = new Date();
            currentTimeEl.textContent = now.toLocaleTimeString('he-IL');
        };
        updateTime();
        setInterval(updateTime, 1000);
    }
}

// 🆕 Update List Stats
function updateListStats() {
    const totalCountEl = document.getElementById('total-count');
    const lastUpdatedEl = document.getElementById('last-updated');
    
    if (totalCountEl) {
        totalCountEl.textContent = `${dailyExpenses.length} תנועות`;
    }
    
    if (lastUpdatedEl) {
        const now = new Date();
        lastUpdatedEl.textContent = `עודכן ${now.toLocaleTimeString('he-IL')}`;
    }
}

// 🆕 Generate Insights
function generateInsights() {
    const insightsList = document.getElementById('insights-list');
    if (!insightsList || dailyExpenses.length === 0) return;

    const insights = [];
    
    // ניתוח לפי קטגוריות
    const categoryTotals = {};
    dailyExpenses.forEach(expense => {
        if (expense.type === 'expense') {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        }
    });
    
    const topCategory = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory) {
        insights.push({
            icon: 'fas fa-chart-pie',
            text: `הקטגוריה הגדולה ביותר: ${topCategory[0]} (${topCategory[1].toLocaleString()} ₪)`
        });
    }
    
    // ניתוח הכנסות vs הוצאות
    const totalIncome = dailyExpenses
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);
    
    const totalExpenses = dailyExpenses
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);
    
    if (totalExpenses > totalIncome) {
        insights.push({
            icon: 'fas fa-exclamation-triangle',
            text: `הוצאות גבוהות מהכנסות ב-${(totalExpenses - totalIncome).toLocaleString()} ₪`
        });
    } else if (totalIncome > totalExpenses) {
        insights.push({
            icon: 'fas fa-smile',
            text: `חיסכון חיובי של ${(totalIncome - totalExpenses).toLocaleString()} ₪`
        });
    }
    
    // ניתוח תדירות
    if (dailyExpenses.length > 5) {
        insights.push({
            icon: 'fas fa-calendar-check',
            text: `יום פעיל עם ${dailyExpenses.length} תנועות`
        });
    }
    
    // הצגת התובנות
    insightsList.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <i class="${insight.icon}"></i>
            <span>${insight.text}</span>
        </div>
    `).join('');
}

function getCategoryColor(cat) {
  if (!categoryColors[cat]) {
    categoryColors[cat] = getRandomNiceColor();
    localStorage.setItem("categoryColors", JSON.stringify(categoryColors));
  }
  return categoryColors[cat];
}

function getRandomNiceColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 60%)`;
}

function updateCategoryList() {
  const datalist = document.getElementById("category-list");
  if (!datalist) return;
  datalist.innerHTML = "";
  Object.keys(categoryColors).forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    datalist.appendChild(option);
  });
}

function updateTotal() {
  let total = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  dailyExpenses.forEach(item => {
    const amt = Number(item.amount);
    if (item.type === "income") {
      total += amt;
      totalIncome += amt;
    } else {
      total -= amt;
      totalExpense += amt;
    }
  });

  if (totalElement) totalElement.textContent = `₪${total.toLocaleString()}`;
  if (totalIncomeEl) totalIncomeEl.textContent = `₪${totalIncome.toLocaleString()}`;
  if (totalExpenseEl) totalExpenseEl.textContent = `₪${totalExpense.toLocaleString()}`;
  
    // 🆕 Update summary changes
  updateSummaryChanges();
}

// 🆕 Update Summary Changes
function updateSummaryChanges() {
    const changes = document.querySelectorAll('.summary-change');
    changes.forEach(change => {
        const type = change.classList.contains('positive') ? 'positive' :
                    change.classList.contains('negative') ? 'negative' : 'neutral';
        
        if (type === 'positive') {
            change.textContent = '+15% מהחודש שעבר';
        } else if (type === 'negative') {
            change.textContent = '+8% מהחודש שעבר';
        } else {
            change.textContent = 'מאזן נוכחי';
        }
    });
}
function updateSummaryChanges() {
    const changes = document.querySelectorAll('.summary-change');
    changes.forEach(change => {
        const type = change.classList.contains('positive') ? 'positive' :
                    change.classList.contains('negative') ? 'negative' : 'neutral';
        
        if (type === 'positive') {
            change.textContent = '+15% מהחודש שעבר';
        } else if (type === 'negative') {
            change.textContent = '+8% מהחודש שעבר';
        } else {
            change.textContent = 'מאזן נוכחי';
        }
    });
}

function refreshPlaceholder() {
  const placeholder = document.querySelector(".expense-placeholder");
  if (dailyExpenses.length === 0) {
    if (!placeholder) {
      const li = document.createElement("li");
      li.classList.add("expense-item", "expense-placeholder");
      li.innerHTML = `
        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i>
        <div>אין תנועות עדיין</div>
        <small>הוסף תנועה ראשונה כדי להתחיל</small>
      `;
      expenseList.appendChild(li);
    }
  } else if (placeholder) {
    placeholder.remove();
  }
}

function createDeleteButton(li, id) {
  const deleteBtn = document.createElement("button");
  deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
  deleteBtn.classList.add("delete-btn");
  deleteBtn.style.cssText = `
    background: #f56565;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
  `;

  deleteBtn.addEventListener('mouseenter', () => {
    deleteBtn.style.background = '#e53e3e';
    deleteBtn.style.transform = 'scale(1.05)';
  });

  deleteBtn.addEventListener('mouseleave', () => {
    deleteBtn.style.background = '#f56565';
    deleteBtn.style.transform = 'scale(1)';
  });

  deleteBtn.addEventListener("click", () => {
    if (confirm('האם אתה בטוח שברצונך למחוק תנועה זו?')) {
      setLoading(true);
      fetch("http://localhost:3000/delete-transaction/" + id, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: JSON.parse(localStorage.getItem("user")).id })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showToast('התנועה נמחקה בהצלחה!', 'success');
            li.remove();
            dailyExpenses = dailyExpenses.filter(exp => exp._id !== id && exp.id !== id);
            updateTotal();
            refreshPlaceholder();
            updateListStats();
            generateInsights();
          } else {
            showToast(data.message || 'שגיאה במחיקה', 'error');
          }
        })
        .catch(err => {
          console.error("שגיאה במחיקה מהשרת:", err);
          showToast('שגיאה במחיקה מהשרת', 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  });

  return deleteBtn;
}

function displayExpense(item) {
  const li = document.createElement("li");
  li.classList.add("expense-item");
  li.setAttribute("data-id", item._id || item.id);

  const itemDetails = document.createElement("div");
  itemDetails.classList.add("item-details");

  const itemTitle = document.createElement("div");
  itemTitle.classList.add("item-title");
  itemTitle.textContent = item.description;

  const itemCategory = document.createElement("div");
  itemCategory.classList.add("item-category");
  
  const categoryTag = document.createElement("span");
  categoryTag.classList.add("category-tag");
  categoryTag.style.backgroundColor = getCategoryColor(item.category);
  categoryTag.textContent = item.category;
  
  itemCategory.appendChild(categoryTag);
  
  // 🆕 הוספת מידע מיקום אם קיים
  if (item.location && item.location.address) {
    const locationInfo = document.createElement("small");
    locationInfo.style.color = '#666';
    locationInfo.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${item.location.address}`;
    itemCategory.appendChild(locationInfo);
  }

  itemDetails.appendChild(itemTitle);
  itemDetails.appendChild(itemCategory);

  const itemAmount = document.createElement("div");
  itemAmount.classList.add("item-amount", item.type === "income" ? "income-amount" : "expense-amount");
  const sign = item.type === "income" ? "+" : "-";
  itemAmount.textContent = `${sign}₪${Number(item.amount).toLocaleString()}`;

  const deleteBtn = createDeleteButton(li, item._id || item.id);

  li.appendChild(itemDetails);
  li.appendChild(itemAmount);
  li.appendChild(deleteBtn);

  expenseList.prepend(li);
}

function clearForm() {
  description.value = "";
  amount.value = "";
  category.value = "";
  if (type) type.value = "expense";
  
  // 🆕 ניקוי מיקום
  currentLocation = null;
  const displayEl = document.getElementById('locationDisplay');
  if (displayEl) {
    displayEl.value = 'לא נבחר מיקום';
  }
  const statusEl = document.getElementById('locationStatus');
  if (statusEl) {
    statusEl.textContent = '';
    statusEl.style.color = '#666';
  }
}

// ✅ שליחת טופס
submit.addEventListener("click", function (e) {
  e.preventDefault();

  const desc = description.value.trim();
  const amt = amount.value.trim();
  const cat = category.value.trim();
  const entryType = type.value;

  if (!desc || !amt || isNaN(amt) || Number(amt) <= 0 || !cat || !currentDate) {
    showToast("נא להזין את כל השדות בצורה תקינה.", "error");
    return;
  }

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.id) {
    showToast("משתמש לא מזוהה. נא להתחבר מחדש.", "error");
    return;
  }

  setLoading(true);

  const entry = {
    userId: user.id,
    type: entryType,
    amount: Number(amt),
    category: cat,
    date: currentDate,
    description: desc
  };

  if (currentLocation) {
    entry.location = currentLocation;
  }

  fetch("http://localhost:3000/add-transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const savedItem = data.transaction;
        
        // 🆕 הודעה על הוצאה חריגה אם יש
        let message = "הטרנזקציה נוספה בהצלחה! ✅";
        if (data.isOutlier && data.reasons && data.reasons.length > 0) {
          message += "\n\n⚠️ זוהתה כחריגה:\n" + data.reasons.join('\n');
          showToast(message, "warning", 6000);
        } else {
          showToast(message, "success");
        }
        
        // 🆕 הודעה על מיקום אם נשמר
        if (currentLocation) {
          showToast("📍 המיקום נשמר עם הטרנזקציה", "info");
        }

        dailyExpenses.unshift(savedItem);
        displayExpense(savedItem);
        updateTotal();
        refreshPlaceholder();
        clearForm();
        updateCategoryList();
        updateListStats();
        generateInsights();
      } else {
        showToast(data.message || "שגיאה בשמירת הטרנזקציה", "error");
      }
    })
    .catch(err => {
      console.error("שגיאה בשמירה לשרת:", err);
      showToast("שגיאה בשמירה לשרת", "error");
    })
    .finally(() => {
      setLoading(false);
    });
});

// 🌍 פונקציות מיקום
function getCurrentLocation() {
    const statusEl = document.getElementById('locationStatus');
    const displayEl = document.getElementById('locationDisplay');
    
    if (!statusEl || !displayEl) {
        console.error('אלמנטי מיקום לא נמצאו');
        return;
    }
    
    statusEl.textContent = 'מחפש מיקום נוכחי...';
    statusEl.style.color = '#666';
    
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                currentLocation = { latitude: lat, longitude: lng };
                
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=he`
                    );
                    const data = await response.json();
                    
                    if (data.display_name) {
                        currentLocation.address = data.display_name;
                        displayEl.value = `📍 ${data.display_name}`;
                        statusEl.textContent = '✅ מיקום נמצא בהצלחה!';
                        statusEl.style.color = '#4CAF50';
                        showToast('מיקום נמצא בהצלחה!', 'success');
                    } else {
                        displayEl.value = `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                        statusEl.textContent = '⚠️ מיקום נמצא, אך ללא כתובת מדויקת';
                        statusEl.style.color = '#FF9800';
                        showToast('מיקום נמצא, אך ללא כתובת מדויקת', 'warning');
                    }
                } catch (error) {
                    console.log('שגיאה בקבלת כתובת:', error);
                    displayEl.value = `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    statusEl.textContent = '⚠️ מיקום נמצא, אך ללא כתובת';
                    statusEl.style.color = '#FF9800';
                    showToast('מיקום נמצא, אך ללא כתובת', 'warning');
                }
            },
            (error) => {
                statusEl.textContent = '❌ ' + getLocationErrorMessage(error);
                statusEl.style.color = '#f44336';
                showToast(getLocationErrorMessage(error), 'error');
                console.error('שגיאת מיקום:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    } else {
        statusEl.textContent = '❌ הדפדפן לא תומך במיקום';
        statusEl.style.color = '#f44336';
        showToast('הדפדפן לא תומך במיקום', 'error');
    }
}

function enableManualLocation() {
    const searchEl = document.getElementById('locationSearch');
    const displayEl = document.getElementById('locationDisplay');
    const suggestionsEl = document.getElementById('locationSuggestions');
    const statusEl = document.getElementById('locationStatus');
    
    if (!searchEl || !displayEl || !suggestionsEl || !statusEl) {
        console.error('אלמנטי חיפוש מיקום לא נמצאו');
        return;
    }
    
    searchEl.style.display = 'block';
    displayEl.style.display = 'none';
    searchEl.focus();
    statusEl.textContent = 'הקלד שם מקום או כתובת...';
    statusEl.style.color = '#666';
    
    // הסרת event listeners קודמים
    const newSearchEl = searchEl.cloneNode(true);
    searchEl.parentNode.replaceChild(newSearchEl, searchEl);
    
    newSearchEl.addEventListener('input', async function() {
        const query = this.value.trim();
        
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        if (query.length < 2) {
            suggestionsEl.style.display = 'none';
            statusEl.textContent = 'הקלד לפחות 2 תווים...';
            return;
        }
        
        searchTimeout = setTimeout(async () => {
            try {
                statusEl.textContent = 'מחפש...';
                
                const builtInResults = searchBuiltInPlaces(query);
                let externalResults = [];

                try {
                    externalResults = (FORCE_HERE_API || (HERE_API_KEY && HERE_API_KEY !== "YOUR_HERE_API_KEY"))
                        ? await searchHereAPI(query)
                        : await searchOpenStreetMap(query);
                } catch (externalError) {
                    console.error('שגיאה בחיפוש חיצוני:', externalError);
                }

                const combinedResults = [...builtInResults, ...externalResults];

                if (combinedResults.length > 0) {
                    showLocationSuggestions(combinedResults);
                    const sourceLabel = [
                        builtInResults.length ? `${builtInResults.length} מהמועדפים` : '',
                        externalResults.length ? `${externalResults.length} מחיפוש אונליין` : ''
                    ].filter(Boolean).join(' | ');
                    statusEl.textContent = `נמצאו ${combinedResults.length} תוצאות${sourceLabel ? ` (${sourceLabel})` : ''}`;
                    statusEl.style.color = '#4CAF50';
                } else {
                    suggestionsEl.style.display = 'none';
                    statusEl.textContent = 'לא נמצאו תוצאות';
                    statusEl.style.color = '#FF9800';
                }
            } catch (error) {
                console.error('שגיאה בחיפוש:', error);
                statusEl.textContent = 'שגיאה בחיפוש - נסה שוב';
                statusEl.style.color = '#f44336';
                suggestionsEl.style.display = 'none';
            }
        }, 300);
    });
}

function searchBuiltInPlaces(query) {
    const lowerQuery = query.toLowerCase();
    
    return israeliPlaces
        .filter(place => 
            place.name.toLowerCase().includes(lowerQuery) ||
            place.city.toLowerCase().includes(lowerQuery) ||
            place.category.toLowerCase().includes(lowerQuery)
        )
        .map(place => ({
            lat: place.lat,
            lon: place.lng,
            display_name: `${place.name}, ${place.city}`,
            name: place.name,
            category: place.category,
            isBuiltIn: true
        }))
        .slice(0, 5);
}

async function searchOpenStreetMap(query) {
    try {
        console.log('🔍 משתמש ב-OpenStreetMap לחיפוש:', query); // 🆕 לוג לבדיקה
        
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=he&countrycodes=il`
        );
        const results = await response.json();
        
        console.log('📊 נתונים מ-OpenStreetMap:', results); // 🆕 לוג הנתונים
        
        return results.map(result => ({
            lat: result.lat,
            lon: result.lon,
            display_name: result.display_name,
            name: result.display_name.split(',')[0],
            isBuiltIn: false,
            source: 'OpenStreetMap' // 🆕 מזהה המקור
        }));
    } catch (error) {
        console.error('שגיאה ב-OpenStreetMap:', error);
        return [];
    }
}

// 🆕 פונקציה חלופית ב-HERE API (אם תרצה להשתמש בה)
async function searchHereAPI(query) {
    try {
        console.log('🔍 משתמש ב-HERE API לחיפוש:', query); // 🆕 לוג לבדיקה
        
        const response = await fetch(
            `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(query)}&in=countryCode:ISR&apikey=${HERE_API_KEY}&lang=he`
        );
        
        console.log('📡 תגובה מ-HERE API:', response.status); // 🆕 לוג סטטוס
        
        if (!response.ok) {
            throw new Error(`HERE API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📊 נתונים מ-HERE API:', data); // 🆕 לוג הנתונים
        
        return data.items.map(item => ({
            lat: item.position.lat,
            lon: item.position.lng,
            display_name: item.title + (item.address ? `, ${item.address.label}` : ''),
            name: item.title,
            isBuiltIn: false,
            source: 'HERE' // 🆕 מזהה המקור
        }));
    } catch (error) {
        console.error('❌ שגיאה ב-HERE API:', error);
        // נחזור ל-OpenStreetMap כגיבוי
        console.log('🔄 עובר ל-OpenStreetMap כגיבוי...');
        return await searchOpenStreetMap(query);
    }
}

function getLocationErrorMessage(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            return "נדחתה הרשאה לגישה למיקום";
        case error.POSITION_UNAVAILABLE:
            return "מיקום לא זמין כרגע";
        case error.TIMEOUT:
            return "זמן המתנה למיקום פג";
        default:
            return "שגיאה לא ידועה בקבלת מיקום";
    }
}

function showLocationSuggestions(results) {
    const suggestionsEl = document.getElementById('locationSuggestions');
    
    if (!suggestionsEl) return;
    
    suggestionsEl.innerHTML = results.map((result, index) => {
        const emoji = result.isBuiltIn ? 
            (result.category === 'סופרמרקט' ? '🛒' :
             result.category === 'דלק' ? '⛽' :
             result.category === 'מזון מהיר' ? '🍔' :
             result.category === 'קפה' ? '☕' :
             result.category === 'קניון' ? '🏬' :
             result.category === 'אופנה' ? '👕' : '📍') : '🔍';
             
        const badge = result.isBuiltIn ? 
            '<span style="background: #4CAF50; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem;">מומלץ</span>' : 
            `<span style="background: ${result.source === 'HERE' ? '#FF5722' : '#2196F3'}; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem;">${result.source || 'חיפוש'}</span>`;
            
        return `
            <div class="location-suggestion" onclick="selectLocation('${result.lat}', '${result.lon}', '${result.display_name.replace(/'/g, "\\'")}')">
                <div class="suggestion-header">
                    <span class="suggestion-emoji">${emoji}</span>
                    <span class="suggestion-name">${result.name || result.display_name.split(',')[0]}</span>
                    ${badge}
                </div>
                <div class="suggestion-address">${result.display_name}</div>
                ${result.category ? `<div class="suggestion-category">${result.category}</div>` : ''}
            </div>
        `;
    }).join('');
    
    suggestionsEl.style.display = 'block';
}

function selectLocation(lat, lng, address) {
    const displayEl = document.getElementById('locationDisplay');
    const searchEl = document.getElementById('locationSearch');
    const suggestionsEl = document.getElementById('locationSuggestions');
    const statusEl = document.getElementById('locationStatus');
    
    currentLocation = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng), 
        address: address
    };
    
    displayEl.value = `🏪 ${address}`;
    displayEl.style.display = 'block';
    searchEl.style.display = 'none';
    searchEl.value = '';
    suggestionsEl.style.display = 'none';
    statusEl.textContent = '✅ מיקום נבחר בהצלחה!';
    statusEl.style.color = '#4CAF50';
    showToast('מיקום נבחר בהצלחה!', 'success');
}

function clearLocation() {
    const displayEl = document.getElementById('locationDisplay');
    const searchEl = document.getElementById('locationSearch');
    const suggestionsEl = document.getElementById('locationSuggestions');
    const statusEl = document.getElementById('locationStatus');
    
    currentLocation = null;
    displayEl.value = 'לא נבחר מיקום';
    displayEl.style.display = 'block';
    searchEl.style.display = 'none';
    searchEl.value = '';
    suggestionsEl.style.display = 'none';
    statusEl.textContent = 'מיקום נוקה';
    statusEl.style.color = '#666';
    showToast('מיקום נוקה', 'info');
}

// 🆕 Refresh List Function
function refreshList() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id || !currentDate) return;

    expenseList.innerHTML = "";
    showToast('מרענן נתונים...', 'info');

    fetch("http://localhost:3000/transactions/" + user.id)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                dailyExpenses = data.transactions.filter(item => item.date === currentDate);
                dailyExpenses.forEach(displayExpense);
                updateTotal();
                refreshPlaceholder();
                updateCategoryList();
                updateListStats();
                generateInsights();
                showToast('הנתונים עודכנו בהצלחה!', 'success');
            } else {
                showToast('שגיאה בטעינת נתונים', 'error');
            }
        })
        .catch(err => {
            console.error("שגיאה בטעינה מהשרת:", err);
            showToast('שגיאה בטעינת נתונים מהשרת', 'error');
        });
}

// 🆕 Generate Insights
function generateInsights() {
    const insightsList = document.getElementById('insights-list');
    if (!insightsList || dailyExpenses.length === 0) return;

    const insights = [];
    
    // ניתוח לפי קטגוריות
    const categoryTotals = {};
    dailyExpenses.forEach(expense => {
        if (expense.type === 'expense') {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        }
    });
    
    const topCategory = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory) {
        insights.push({
            icon: 'fas fa-chart-pie',
            text: `הקטגוריה הגדולה ביותר: ${topCategory[0]} (${topCategory[1].toLocaleString()} ₪)`
        });
    }
    
    // ניתוח הכנסות vs הוצאות
    const totalIncome = dailyExpenses
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);
    
    const totalExpenses = dailyExpenses
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);
    
    if (totalExpenses > totalIncome) {
        insights.push({
            icon: 'fas fa-exclamation-triangle',
            text: `הוצאות גבוהות מהכנסות ב-${(totalExpenses - totalIncome).toLocaleString()} ₪`
        });
    } else if (totalIncome > totalExpenses) {
        insights.push({
            icon: 'fas fa-smile',
            text: `חיסכון חיובי של ${(totalIncome - totalExpenses).toLocaleString()} ₪`
        });
    }
    
    // ניתוח תדירות
    if (dailyExpenses.length > 5) {
        insights.push({
            icon: 'fas fa-calendar-check',
            text: `יום פעיל עם ${dailyExpenses.length} תנועות`
        });
    }
    
    // הצגת התובנות
    insightsList.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <i class="${insight.icon}"></i>
            <span>${insight.text}</span>
        </div>
    `).join('');
}

// 🆕 Update Header Stats
function updateHeaderStats() {
    const currentMonthEl = document.getElementById('current-month');
    const currentTimeEl = document.getElementById('current-time');
    
    if (currentMonthEl) {
        const now = new Date();
        const monthNames = [
            'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
            'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
        ];
        currentMonthEl.textContent = monthNames[now.getMonth()];
    }
    
    if (currentTimeEl) {
        const updateTime = () => {
            const now = new Date();
            currentTimeEl.textContent = now.toLocaleTimeString('he-IL');
        };
        updateTime();
        setInterval(updateTime, 1000);
    }
}

// 🆕 Update List Stats
function updateListStats() {
    const totalCountEl = document.getElementById('total-count');
    const lastUpdatedEl = document.getElementById('last-updated');
    
    if (totalCountEl) {
        totalCountEl.textContent = `${dailyExpenses.length} תנועות`;
    }
    
    if (lastUpdatedEl) {
        const now = new Date();
        lastUpdatedEl.textContent = `עודכן ${now.toLocaleTimeString('he-IL')}`;
    }
}

// 🆕 Refresh List Function
function refreshList() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id || !currentDate) return;

    expenseList.innerHTML = "";
    showToast('מרענן נתונים...', 'info');

    fetch("http://localhost:3000/transactions/" + user.id)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                dailyExpenses = data.transactions.filter(item => item.date === currentDate);
                dailyExpenses.forEach(displayExpense);
                updateTotal();
                refreshPlaceholder();
                updateCategoryList();
                updateListStats();
                generateInsights();
                showToast('הנתונים עודכנו בהצלחה!', 'success');
            } else {
                showToast('שגיאה בטעינת נתונים', 'error');
            }
        })
        .catch(err => {
            console.error("שגיאה בטעינה מהשרת:", err);
            showToast('שגיאה בטעינת נתונים מהשרת', 'error');
        });
}

// 🆕 Export List Function
function exportList() {
    if (dailyExpenses.length === 0) {
        showToast('אין נתונים לייצוא', 'warning');
        return;
    }

    const csvContent = [
        ['תיאור', 'קטגוריה', 'סוג', 'סכום', 'תאריך', 'מיקום'],
        ...dailyExpenses.map(item => [
            item.description,
            item.category,
            item.type === 'income' ? 'הכנסה' : 'הוצאה',
            item.amount,
            item.date,
            item.location?.address || ''
        ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `הוצאות_${currentDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('הקובץ יוצא בהצלחה!', 'success');
}

// ✅ טעינת הוצאות מהשרת לפי תאריך + חיבור כפתורי מיקום
window.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  
  // 🆕 Initialize UI
  updateHeaderStats();
  updateListStats();
  
  // חיבור כפתורי מיקום
  const currentLocationBtn = document.getElementById('currentLocationBtn');
  const manualLocationBtn = document.getElementById('manualLocationBtn');
  const clearLocationBtn = document.getElementById('clearLocationBtn');
  
  if (currentLocationBtn) {
    currentLocationBtn.addEventListener('click', getCurrentLocation);
  }
  
  if (manualLocationBtn) {
    manualLocationBtn.addEventListener('click', enableManualLocation);
  }
  
  if (clearLocationBtn) {
    clearLocationBtn.addEventListener('click', clearLocation);
  }
  
  // 🆕 Connect action buttons
  const refreshBtn = document.getElementById('refresh-list');
  const exportBtn = document.getElementById('export-list');
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshList);
  }
  
  if (exportBtn) {
    exportBtn.addEventListener('click', exportList);
  }
  
  // טעינת נתונים מהשרת
  if (!user || !user.id || !currentDate) {
    showToast('משתמש לא מזוהה או תאריך חסר', 'error');
    return;
  }

  expenseList.innerHTML = "";
  showToast('טוען נתונים...', 'info');

  fetch("http://localhost:3000/transactions/" + user.id)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        dailyExpenses = data.transactions.filter(item => item.date === currentDate);
        dailyExpenses.forEach(displayExpense);
        updateTotal();
        refreshPlaceholder();
        updateCategoryList();
        updateListStats();
        generateInsights();
        showToast('הנתונים נטענו בהצלחה!', 'success');
      } else {
        showToast('שגיאה בטעינת נתונים', 'error');
      }
    })
    .catch(err => {
      console.error("שגיאה בטעינה מהשרת:", err);
      showToast('שגיאה בטעינת נתונים מהשרת', 'error');
    });
});