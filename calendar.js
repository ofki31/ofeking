// 📅 Calendar Management System
class CalendarManager {
    constructor() {
        this.currentYear = new Date().getFullYear();
        this.currentMonth = new Date().getMonth();
        this.today = new Date();
        this.monthNames = [
            "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
            "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateHeaderStats();
        this.renderCalendar();
        this.startClock();
    }

    // 🗓️ Render Calendar
    renderCalendar() {
        const calendar = document.getElementById("calendar");
        calendar.innerHTML = "";

        const totalDays = this.getDaysInMonth(this.currentYear, this.currentMonth);
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        
        // Update month title
        document.getElementById("month-title").textContent = 
            `${this.monthNames[this.currentMonth]} ${this.currentYear}`;

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement("div");
            emptyDiv.classList.add("empty-day");
            calendar.appendChild(emptyDiv);
        }

        // Add days of the month
        for (let day = 1; day <= totalDays; day++) {
            const dayDiv = this.createDayElement(day);
            calendar.appendChild(dayDiv);
        }

        // Add animation to calendar
        this.animateCalendar();
    }

    // 🎨 Create Day Element
    createDayElement(day) {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day-box");
        
        const dayStr = String(day).padStart(2, "0");
        const monthStr = String(this.currentMonth + 1).padStart(2, "0");
        const fullDate = `${this.currentYear}-${monthStr}-${dayStr}`;
        const fullDateObj = new Date(`${this.currentYear}-${monthStr}-${dayStr}`);
        
        // Reset time for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        fullDateObj.setHours(0, 0, 0, 0);

        // Create day number element
        const dayNumber = document.createElement("div");
        dayNumber.classList.add("day-number");
        dayNumber.textContent = day;
        dayDiv.appendChild(dayNumber);

        // Add weekend styling
        const dayOfWeek = fullDateObj.getDay();
        if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
            dayDiv.classList.add("weekend");
        }

        // Check if it's today
        if (fullDateObj.getTime() === today.getTime()) {
            dayDiv.classList.add("today");
        }

        // Handle past, present, and future days
        if (fullDateObj <= today) {
            // Past or present day - navigate to detailed transactions page
            dayDiv.addEventListener('click', () => {
                window.location.href = `index.html?date=${fullDate}`;
            });
            dayDiv.style.cursor = 'pointer';
            
            // Add transaction indicators
            this.addTransactionIndicators(dayDiv, fullDate);
            
            return dayDiv;
        } else {
            // Future day
            dayDiv.classList.add("future-day");
            return dayDiv;
        }
    }

    // 💰 Add Transaction Indicators
    async addTransactionIndicators(dayDiv, date) {
        try {
            // Get user ID from localStorage
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                return; // No user logged in
            }
            
            // Fetch transactions for this date from backend
            const response = await fetch(`http://localhost:3000/transactions/${user.id}`);
            if (!response.ok) {
                return; // Could not fetch transactions
            }
            
            const data = await response.json();
            const transactions = data.transactions || data || [];
            
            // Filter transactions for this specific date
            const dayTransactions = transactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                const targetDate = new Date(date);
                return transactionDate.toDateString() === targetDate.toDateString();
            });
            
            if (dayTransactions.length > 0) {
                const indicatorsDiv = document.createElement("div");
                indicatorsDiv.classList.add("day-indicators");
                
                // Check for income and expense transactions
                const hasIncome = dayTransactions.some(t => t.type === 'income');
                const hasExpense = dayTransactions.some(t => t.type === 'expense');
                
                if (hasIncome) {
                    const incomeIndicator = document.createElement("div");
                    incomeIndicator.classList.add("day-indicator", "income");
                    indicatorsDiv.appendChild(incomeIndicator);
                }
                
                if (hasExpense) {
                    const expenseIndicator = document.createElement("div");
                    expenseIndicator.classList.add("day-indicator", "expense");
                    indicatorsDiv.appendChild(expenseIndicator);
                }
                
                dayDiv.appendChild(indicatorsDiv);
            }
        } catch (error) {
            console.error("Error adding transaction indicators:", error);
        }
    }

    // 🎭 Animate Calendar
    animateCalendar() {
        const dayBoxes = document.querySelectorAll('.day-box');
        dayBoxes.forEach((box, index) => {
            box.style.animationDelay = `${index * 0.05}s`;
            box.style.animation = 'fadeInUp 0.5s ease-out forwards';
        });
    }

    // 📊 Update Header Stats
    updateHeaderStats() {
        const currentTimeElement = document.getElementById('current-time');
        const currentDateElement = document.getElementById('current-date');
        
        if (currentTimeElement && currentDateElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('he-IL', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            const dateString = now.toLocaleDateString('he-IL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            currentTimeElement.textContent = timeString;
            currentDateElement.textContent = dateString;
        }
    }

    // ⏰ Start Real-time Clock
    startClock() {
        setInterval(() => {
            this.updateHeaderStats();
        }, 1000);
    }

    // 📅 Navigate to Previous Month
    previousMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.renderCalendar();
        this.showToast('עבר לחודש הקודם', 'info');
    }

    // 📅 Navigate to Next Month
    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.renderCalendar();
        this.showToast('עבר לחודש הבא', 'info');
    }

    // 🏠 Go to Today
    goToToday() {
        this.currentYear = this.today.getFullYear();
        this.currentMonth = this.today.getMonth();
        this.renderCalendar();
        this.showToast('חזרת להיום', 'success');
    }

    // 📅 Get Days in Month
    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    // 🔧 Setup Event Listeners
    setupEventListeners() {
        // Navigation buttons
        document.getElementById("prev-month").addEventListener("click", () => {
            this.previousMonth();
        });

        document.getElementById("next-month").addEventListener("click", () => {
            this.nextMonth();
        });

        // Today button
        const todayBtn = document.getElementById("today-btn");
        if (todayBtn) {
            todayBtn.addEventListener("click", () => {
                this.goToToday();
            });
        }

        // Year view button
        const yearViewBtn = document.getElementById("year-view-btn");
        if (yearViewBtn) {
            yearViewBtn.addEventListener("click", () => {
                this.showToast('תצוגת שנה תתווסף בקרוב!', 'warning');
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.nextMonth();
                    break;
                case 'ArrowRight':
                    this.previousMonth();
                    break;
                case 'Home':
                    this.goToToday();
                    break;
            }
        });
    }

    // 💰 Show Add Transaction Modal
    showAddTransactionModal(date) {
        // Create modal HTML
        const modalHTML = `
            <div class="transaction-modal" id="transactionModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>הוסף תנועה חדשה</h3>
                        <button class="close-btn" onclick="this.closest('.transaction-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form id="transactionForm">
                        <div class="form-group">
                            <label for="transactionType">סוג תנועה:</label>
                            <select id="transactionType" required>
                                <option value="expense">💸 הוצאה</option>
                                <option value="income">💰 הכנסה</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="transactionDescription">תיאור:</label>
                            <input type="text" id="transactionDescription" required placeholder="למשל: קניות בסופר, משכורת...">
                        </div>
                        
                        <div class="form-group">
                            <label for="transactionAmount">סכום:</label>
                            <input type="number" id="transactionAmount" required placeholder="0" min="0" step="0.01">
                        </div>
                        
                        <div class="form-group">
                            <label for="transactionCategory">קטגוריה:</label>
                            <input type="text" id="transactionCategory" list="categoryList" placeholder="למשל: אוכל, פנאי, דלק...">
                            <datalist id="categoryList">
                                <option value="אוכל">🍽️ אוכל</option>
                                <option value="תחבורה">🚗 תחבורה</option>
                                <option value="פנאי">🎮 פנאי</option>
                                <option value="קניות">🛒 קניות</option>
                                <option value="חשבונות">📄 חשבונות</option>
                                <option value="משכורת">💼 משכורת</option>
                                <option value="דלק">⛽ דלק</option>
                                <option value="בריאות">🏥 בריאות</option>
                                <option value="חינוך">📚 חינוך</option>
                                <option value="בילויים">🎉 בילויים</option>
                            </datalist>
                        </div>
                        
                        <div class="form-group">
                            <label for="transactionDate">תאריך:</label>
                            <input type="date" id="transactionDate" value="${date}" required>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="this.closest('.transaction-modal').remove()">
                                ביטול
                            </button>
                            <button type="submit" class="btn-submit">
                                <i class="fas fa-plus"></i>
                                הוסף תנועה
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add event listener to form
        const form = document.getElementById('transactionForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitTransaction();
        });
        
        // Add modal styles if not already added
        if (!document.getElementById('transactionModalStyles')) {
            const style = document.createElement('style');
            style.id = 'transactionModalStyles';
            style.textContent = `
                .transaction-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    direction: rtl;
                }
                
                .modal-content {
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #f0f0f0;
                }
                
                .modal-header h3 {
                    margin: 0;
                    color: #333;
                    font-size: 1.5rem;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                    padding: 5px;
                    border-radius: 5px;
                    transition: all 0.3s;
                }
                
                .close-btn:hover {
                    background: #f0f0f0;
                    color: #333;
                }
                
                .form-group {
                    margin-bottom: 20px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #333;
                }
                
                .form-group input,
                .form-group select {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: all 0.3s;
                }
                
                .form-group input:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                .form-actions {
                    display: flex;
                    gap: 15px;
                    margin-top: 30px;
                }
                
                .btn-cancel,
                .btn-submit {
                    flex: 1;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .btn-cancel {
                    background: #f0f0f0;
                    color: #666;
                }
                
                .btn-cancel:hover {
                    background: #e0e0e0;
                }
                
                .btn-submit {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                
                .btn-submit:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
                }
                
                @media (max-width: 768px) {
                    .modal-content {
                        padding: 20px;
                        margin: 20px;
                    }
                    
                    .form-actions {
                        flex-direction: column;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 💰 Submit Transaction
    async submitTransaction() {
        try {
            const form = document.getElementById('transactionForm');
            const formData = new FormData(form);
            
            const transaction = {
                type: document.getElementById('transactionType').value,
                description: document.getElementById('transactionDescription').value,
                amount: parseFloat(document.getElementById('transactionAmount').value),
                category: document.getElementById('transactionCategory').value,
                date: document.getElementById('transactionDate').value,
                userId: JSON.parse(localStorage.getItem('user'))?.id || 'test'
            };
            
            // Send to backend
            const response = await fetch('http://localhost:3000/add-transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transaction)
            });
            
            if (response.ok) {
                this.showToast('התנועה נוספה בהצלחה!', 'success');
                document.getElementById('transactionModal').remove();
                this.renderCalendar(); // Refresh calendar
            } else {
                throw new Error('Failed to add transaction');
            }
        } catch (error) {
            console.error('Error submitting transaction:', error);
            this.showToast('שגיאה בהוספת התנועה', 'error');
        }
    }

    // 🍞 Show Toast Notification
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.classList.add('toast', type);
        
        const icon = document.createElement('i');
        switch(type) {
            case 'success':
                icon.className = 'fas fa-check-circle';
                break;
            case 'error':
                icon.className = 'fas fa-exclamation-circle';
                break;
            case 'warning':
                icon.className = 'fas fa-exclamation-triangle';
                break;
            default:
                icon.className = 'fas fa-info-circle';
        }
        
        const text = document.createElement('span');
        text.textContent = message;
        
        toast.appendChild(icon);
        toast.appendChild(text);
        toastContainer.appendChild(toast);

        // Remove toast after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideInLeft 0.3s ease-out reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }
}

// 🚀 Initialize Calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const calendar = new CalendarManager();
    
    // Add some CSS for the fadeInUp animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            from { 
                opacity: 0; 
                transform: translateY(20px); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0); 
            }
        }
        
        .day-box {
            opacity: 0;
        }
    `;
    document.head.appendChild(style);
    
    // Show welcome message
    setTimeout(() => {
        calendar.showToast('ברוכים הבאים ללוח ההוצאות!', 'success');
    }, 1000);
    
    // Make calendar instance globally available
    window.calendarInstance = calendar;
});

// 💰 Quick Add Transaction Function
function addQuickTransaction() {
    const today = new Date().toISOString().split('T')[0];
    if (window.calendarInstance) {
        window.calendarInstance.showAddTransactionModal(today);
    }
}
  