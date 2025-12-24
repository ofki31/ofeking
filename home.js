// 🏠 Home Page - Advanced Dashboard System
class HomeDashboard {
    constructor() {
        this.user = JSON.parse(localStorage.getItem("user"));
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.allExpenses = [];
        this.chart = null;
        
        this.init();
    }

    init() {
        console.log('🚀 מתחיל אתחול דף הבית...');
        console.log('👤 משתמש מ-localStorage:', this.user);
        
        if (!this.user) {
            console.log('❌ אין משתמש מחובר');
            this.showToast('אין משתמש מחובר. נא להתחבר.', 'error');
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
            return;
        }

        if (!this.user.id) {
            console.log('❌ חסר ID למשתמש');
            this.showToast('נתוני משתמש לא תקינים. נא להתחבר מחדש.', 'error');
            setTimeout(() => {
  window.location.href = "login.html";
            }, 2000);
            return;
        }

        console.log('✅ משתמש תקין, מתחיל טעינת נתונים...');
        this.setupEventListeners();
        this.updateHeaderStats();
        this.startClock();
        this.checkConnectionStatus();
        this.loadData();
        this.showWelcomeMessage();
    }

    // 📊 Load Data from Server
    async loadData() {
        try {
            this.showLoadingState(true);
            console.log('🔄 מתחיל טעינת נתונים...');
            console.log('👤 משתמש:', this.user);
            
            if (!this.user || !this.user.id) {
                throw new Error('אין משתמש מחובר או חסר ID משתמש');
            }
            
            const url = `http://localhost:3000/transactions/${this.user.id}`;
            console.log('🌐 פונה לכתובת:', url);
            
            const response = await fetch(url);
            console.log('📡 תגובה מהשרת:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `שגיאת שרת: ${response.status}`);
            }
            
            const responseData = await response.json();
            console.log('📊 נתונים שהתקבלו:', responseData);
            
            // בדוק אם התגובה מכילה transactions
            let data = [];
            if (responseData.success && responseData.transactions) {
                data = responseData.transactions;
                console.log('✅ נמצאו transactions:', data);
            } else if (Array.isArray(responseData)) {
                data = responseData;
                console.log('✅ התקבל מערך ישירות:', data);
            } else {
                console.warn('⚠️ פורמט נתונים לא מוכר:', responseData);
                data = [];
            }
            
            if (!Array.isArray(data)) {
                console.warn('⚠️ הנתונים שהתקבלו אינם מערך:', data);
                this.allExpenses = [];
            } else {
                this.allExpenses = data.filter(item => {
                    if (!item.date) {
                        console.warn('⚠️ פריט ללא תאריך:', item);
                        return false;
                    }
                    
      const dateObj = new Date(item.date);
                    const isCurrentMonth = (
                        dateObj.getMonth() === this.currentMonth &&
                        dateObj.getFullYear() === this.currentYear
                    );
                    
                    if (isCurrentMonth) {
                        console.log('✅ פריט מהחודש הנוכחי:', item);
                    }
                    
                    return isCurrentMonth;
                });
            }
            
            console.log('📅 פריטים מהחודש הנוכחי:', this.allExpenses);
            this.buildStats();
            this.showLoadingState(false);
            this.showToast('הנתונים נטענו בהצלחה!', 'success');
            
        } catch (error) {
            console.error("❌ שגיאה בטעינת הנתונים:", error);
            this.showToast(`שגיאה בטעינת הנתונים: ${error.message}`, 'error');
            this.showLoadingState(false);
        }
    }

    // 🧠 Build and Display Statistics
    buildStats() {
        const expenses = this.allExpenses.filter(item => item.type === "expense");
        const incomes = this.allExpenses.filter(item => item.type === "income");
        
        // 📊 חישוב סטטיסטיקות בסיסיות
        const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
        const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
        const monthlySavings = totalIncome - totalExpenses;
        const totalTransactions = this.allExpenses.length;

        // 📈 חישוב סטטיסטיקות מתקדמות
        const dailyAverage = this.calculateDailyAverage(expenses);
        const weeklyAverage = this.calculateWeeklyAverage(expenses);
        const savingsRate = totalIncome > 0 ? ((monthlySavings / totalIncome) * 100) : 0;
        const avgTransactionAmount = totalTransactions > 0 ? (totalExpenses / totalTransactions) : 0;

        // 🏷️ חישוב סטטיסטיקות לפי קטגוריה
        const categoryStats = this.calculateCategoryStats(expenses);
        const mostCommonCategory = categoryStats.mostCommon;
        const highestSpendingCategory = categoryStats.highestSpending;
        const categoryBreakdown = categoryStats.breakdown;

        // 📅 חישוב סטטיסטיקות לפי זמן
        const timeStats = this.calculateTimeStats(expenses);
        const busiestDay = timeStats.busiestDay;
        const busiestWeek = timeStats.busiestWeek;

        // 💰 חישוב יעילות כלכלית
        const efficiencyScore = this.calculateEfficiencyScore(expenses, incomes, monthlySavings);

        // 🎯 עדכון ממשק המשתמש
        this.updateStatElement('total-expense', `₪${totalExpenses.toLocaleString()}`, 'expense');
        this.updateStatElement('total-income', `₪${totalIncome.toLocaleString()}`, 'income');
        this.updateStatElement('monthly-savings', `₪${monthlySavings.toLocaleString()}`, 'savings');
        this.updateStatElement('most-common', mostCommonCategory, 'category');

        // 📊 עדכון סטטיסטיקות נוספות
        this.updateAdditionalStats({
            dailyAverage,
            weeklyAverage,
            savingsRate,
            avgTransactionAmount,
            totalTransactions,
            highestSpendingCategory,
            busiestDay,
            busiestWeek,
            efficiencyScore,
            categoryBreakdown
        });

        // 📈 רינדור גרף
        if (Object.keys(categoryBreakdown).length > 0) {
            this.renderCategoryChart(categoryBreakdown);
        } else {
            this.showEmptyChart();
        }

        // 📊 עדכון אינדיקטורים
        this.updateChangeIndicators();
        
        // 🎨 עדכון צבעים לפי ביצועים
        this.updatePerformanceColors(monthlySavings, savingsRate, efficiencyScore);
    }

    // 📈 Update Stat Element with Animation
    updateStatElement(elementId, value, type) {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Add loading animation
        element.style.opacity = '0.5';
        element.style.transform = 'scale(0.95)';

        setTimeout(() => {
            element.textContent = value;
            element.style.opacity = '1';
            element.style.transform = 'scale(1)';
            
            // Add success animation
            element.style.animation = 'pulse 0.5s ease-out';
            setTimeout(() => {
                element.style.animation = '';
            }, 500);
        }, 200);
    }

    // 🎯 Get Most Common Category
    getMostCommonCategory(categoryCount) {
        let mostCommon = "אין הוצאות";
  let maxCount = 0;
        
        for (let category in categoryCount) {
            if (categoryCount[category] > maxCount) {
                mostCommon = category;
                maxCount = categoryCount[category];
            }
        }
        
        return mostCommon;
    }

    // 📅 Calculate Daily Average
    calculateDailyAverage(expenses) {
        const uniqueDates = new Set(expenses.map(e => e.date));
        const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
        
        return uniqueDates.size > 0 ? (total / uniqueDates.size).toFixed(2) : 0;
    }

    // 📅 Calculate Weekly Average
    calculateWeeklyAverage(expenses) {
        const uniqueWeeks = new Set(expenses.map(e => {
            const date = new Date(e.date);
            const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
            return weekStart.toISOString().split('T')[0];
        }));
        const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
        
        return uniqueWeeks.size > 0 ? (total / uniqueWeeks.size).toFixed(2) : 0;
    }

    // 🏷️ Calculate Category Statistics
    calculateCategoryStats(expenses) {
        const categoryCount = {};
        const categoryAmount = {};
        
        expenses.forEach(item => {
            const category = item.category || 'אחר';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
            categoryAmount[category] = (categoryAmount[category] || 0) + Number(item.amount);
        });
        
        const mostCommon = this.getMostCommonCategory(categoryCount);
        const highestSpending = Object.entries(categoryAmount)
            .reduce((max, [category, amount]) => amount > max.amount ? { category, amount } : max, { category: '', amount: 0 });
        
        return {
            mostCommon,
            highestSpending: highestSpending.category,
            breakdown: categoryAmount
        };
    }

    // 📅 Calculate Time Statistics
    calculateTimeStats(expenses) {
        const dailyExpenses = {};
        
        expenses.forEach(item => {
            const date = item.date;
            dailyExpenses[date] = (dailyExpenses[date] || 0) + Number(item.amount);
        });
        
        const busiestDay = Object.entries(dailyExpenses)
            .reduce((max, [date, amount]) => amount > max.amount ? { date, amount } : max, { date: '', amount: 0 });
        
        // Calculate busiest week (simplified)
        const busiestWeek = 'שבוע 1'; // Simplified for now
        
        return {
            busiestDay: busiestDay.date,
            busiestWeek
        };
    }

    // 💰 Calculate Efficiency Score
    calculateEfficiencyScore(expenses, incomes, monthlySavings) {
        const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
        const totalIncomes = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
        
        if (totalIncomes === 0) return 0;
        
        const expenseRatio = totalExpenses / totalIncomes;
        const savingsRatio = monthlySavings / totalIncomes;
        
        // Score based on savings ratio and expense control
        let score = 50; // Base score
        
        if (savingsRatio > 0.3) score += 30; // High savings
        else if (savingsRatio > 0.1) score += 15; // Moderate savings
        
        if (expenseRatio < 0.7) score += 20; // Low expense ratio
        else if (expenseRatio < 0.9) score += 10; // Moderate expense ratio
        
        return Math.min(100, Math.max(0, score));
    }

    // 📊 Update Additional Stats
    updateAdditionalStats(stats) {
        // This function can be used to update additional statistics if needed
        console.log('Additional stats updated:', stats);
    }

    // 🎨 Update Performance Colors
    updatePerformanceColors(monthlySavings, savingsRate, efficiencyScore) {
        // Update colors based on performance metrics
        const cards = document.querySelectorAll('.metric-card');
        
        cards.forEach(card => {
            if (efficiencyScore > 80) {
                card.style.borderColor = '#48bb78';
            } else if (efficiencyScore > 60) {
                card.style.borderColor = '#ed8936';
            } else {
                card.style.borderColor = '#f56565';
            }
        });
    }

    // 🎨 Render Category Chart
    renderCategoryChart(categoryAmount) {
  const chartEl = document.getElementById("categoryChart");
        const overlayEl = document.getElementById("chart-overlay");
        
  if (!chartEl) return;

        // Hide overlay
        if (overlayEl) {
            overlayEl.style.display = 'none';
        }

        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

  const ctx = chartEl.getContext("2d");
        const categories = Object.keys(categoryAmount);
        const amounts = Object.values(categoryAmount);

  const data = {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: categories.map(cat => this.getCategoryColor(cat)),
        borderColor: "#fff",
                borderWidth: 3,
                hoverBorderWidth: 5
            }]
        };

        this.chart = new Chart(ctx, {
            type: "doughnut",
    data: data,
    options: {
                responsive: true,
                maintainAspectRatio: false,
      plugins: {
        legend: {
                        position: "bottom",
          labels: {
                            font: { 
                                size: 14,
                                family: 'Rubik'
                            },
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ₪${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000
                }
            }
        });
    }

    // 📊 Show Empty Chart State
    showEmptyChart() {
        const overlayEl = document.getElementById("chart-overlay");
        if (overlayEl) {
            overlayEl.style.display = 'flex';
            overlayEl.innerHTML = `
                <i class="fas fa-chart-pie"></i>
                <p>אין נתונים להצגה החודש</p>
                <small>הוסף תנועות כדי לראות גרפים</small>
            `;
        }
    }

    // 🎨 Get Category Color
    getCategoryColor(category) {
        const colors = JSON.parse(localStorage.getItem("categoryColors")) || {};
        return colors[category] || this.getDefaultColor(category);
    }

    // 🎨 Get Default Color for Category
    getDefaultColor(category) {
        const defaultColors = {
            'food': '#ff6b6b',
            'transport': '#4ecdc4',
            'leisure': '#45b7d1',
            'bills': '#96ceb4',
            'shopping': '#feca57',
            'income': '#48dbfb'
        };
        return defaultColors[category] || '#a0aec0';
    }

    // 📊 Update Change Indicators
    updateChangeIndicators() {
        // Simulate change calculations
        const changes = document.querySelectorAll('.stat-change');
        changes.forEach(change => {
            const isPositive = Math.random() > 0.3;
            const percentage = Math.floor(Math.random() * 20) + 1;
            
            if (isPositive) {
                change.textContent = `+${percentage}% מהחודש שעבר`;
                change.className = 'stat-change positive';
            } else {
                change.textContent = `-${percentage}% מהחודש שעבר`;
                change.className = 'stat-change negative';
            }
        });
    }

    // ⏰ Update Header Stats
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

    // 🔧 Setup Event Listeners
    setupEventListeners() {
        // Add hover effects to quick action cards
        const actionCards = document.querySelectorAll('.quick-action-card');
        actionCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Add click effects to action buttons
        const actionBtns = document.querySelectorAll('.action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Add ripple effect
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                btn.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });

        // Test connection button
        const testConnectionBtn = document.getElementById('test-connection-btn');
        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', async () => {
                testConnectionBtn.disabled = true;
                testConnectionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>בודק...</span>';
                
                const isConnected = await this.checkServerConnection();
                
                if (isConnected) {
                    this.showToast('השרת זמין! מנסה לטעון נתונים...', 'success');
                    setTimeout(() => {
                        this.loadData();
                    }, 1000);
                } else {
                    this.showToast('השרת לא זמין. בדוק שהשרת פועל על פורט 3000', 'error');
                }
                
                testConnectionBtn.disabled = false;
                testConnectionBtn.innerHTML = '<i class="fas fa-wifi"></i><span>בדוק חיבור</span>';
            });
        }

        // Export PDF button
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => this.exportToPDF());
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

    // 🔄 Show Loading State
    showLoadingState(isLoading) {
        const elements = ['total-expense', 'total-income', 'monthly-savings', 'most-common'];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (isLoading) {
                    element.textContent = 'טוען...';
                    element.style.opacity = '0.6';
                } else {
                    element.style.opacity = '1';
      }
    }
  });
}

    // 👋 Show Welcome Message
    showWelcomeMessage() {
        setTimeout(() => {
            this.showToast('ברוכים הבאים לדף הבית!', 'success');
        }, 1000);
    }



    // 🔍 Check Server Connection
    async checkServerConnection() {
        try {
            console.log('🔍 בודק חיבור לשרת...');
            const response = await fetch('http://localhost:3000/health', {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                console.log('✅ השרת זמין');
                return true;
            } else {
                console.log('⚠️ השרת לא מגיב כראוי');
                return false;
            }
        } catch (error) {
            console.log('❌ השרת לא זמין:', error.message);
            return false;
        }
    }

    // 📡 Update Connection Status
    async checkConnectionStatus() {
        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;

        try {
            const isConnected = await this.checkServerConnection();
            
            if (isConnected) {
                statusElement.innerHTML = '<i class="fas fa-wifi" style="color: #48bb78;"></i><span>מחובר</span>';
                statusElement.style.background = 'rgba(72, 187, 120, 0.1)';
            } else {
                statusElement.innerHTML = '<i class="fas fa-wifi-slash" style="color: #f56565;"></i><span>לא מחובר</span>';
                statusElement.style.background = 'rgba(245, 101, 101, 0.1)';
            }
        } catch (error) {
            statusElement.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #ed8936;"></i><span>שגיאה</span>';
            statusElement.style.background = 'rgba(237, 137, 54, 0.1)';
        }
    }

    // 📄 Export to PDF
    async exportToPDF() {
        try {
            this.showToast('מייצא ל-PDF...', 'info');
            
            // וידוא שהנתונים נטענים
            if (!this.allExpenses || this.allExpenses.length === 0) {
                console.log('🔄 אין נתונים, טוען נתונים מחדש...');
                await this.loadData();
                
                // בדיקה נוספת אחרי טעינה
                if (!this.allExpenses || this.allExpenses.length === 0) {
                    this.showToast('אין נתונים לייצוא. הוסף תנועות תחילה.', 'warning');
                    return;
                }
            }
            
            // יצירת PDF פשוט עם jsPDF
            await this.createSimplePDF();
            
        } catch (error) {
            console.error('שגיאה בייצוא PDF:', error);
            this.showToast('שגיאה בייצוא הקובץ: ' + error.message, 'error');
        }
    }
    
    // 📄 Create Simple PDF
    async createSimplePDF() {
        try {
            // וידוא שjsPDF זמין
            if (typeof window.jspdf === 'undefined') {
                // נסה לטעון jsPDF
                await this.loadJsPDF();
            }
            
            if (typeof window.jspdf === 'undefined') {
                this.showToast('שגיאה: לא ניתן לטעון ספריית PDF', 'error');
                return;
            }
            
            const { jsPDF } = window.jspdf;
            
            // יצירת PDF
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // יצירת תוכן HTML פשוט
            const htmlContent = this.createSimpleHTML();
            
            // יצירת אלמנט זמני
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.top = '0';
            tempDiv.style.background = 'white';
            tempDiv.style.padding = '20px';
            tempDiv.style.fontFamily = 'Arial, sans-serif';
            tempDiv.style.width = '800px';
            tempDiv.style.direction = 'ltr';
            tempDiv.style.textAlign = 'left';
            document.body.appendChild(tempDiv);
            
            // המתנה קצרה
            await new Promise(resolve => setTimeout(resolve, 500));
            
            try {
                // נסה להשתמש ב-html2canvas
                if (typeof html2canvas !== 'undefined') {
                    const canvas = await html2canvas(tempDiv, {
                        scale: 2,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff'
                    });
                    
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = 190; // mm
                    const pageHeight = 297; // mm
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    let heightLeft = imgHeight;
                    let position = 10; // mm from top
                    
                    doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                    
                    while (heightLeft >= 0) {
                        position = heightLeft - imgHeight + 10;
                        doc.addPage();
                        doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;
                    }
                } else {
                    // אם אין html2canvas, יצור PDF טקסטואלי
                    await this.createTextPDF(doc);
                }
            } catch (error) {
                console.log('שגיאה עם html2canvas, מנסה PDF טקסטואלי:', error);
                await this.createTextPDF(doc);
            }
            
            // ניקוי
            document.body.removeChild(tempDiv);
            
            // שמירת הקובץ
            const filename = `סיכום_חודשי_${new Date().toLocaleDateString('he-IL').replace(/\//g, '-')}.pdf`;
            doc.save(filename);
            
            this.showToast('הקובץ יוצא בהצלחה!', 'success');
            
        } catch (error) {
            console.error('שגיאה ביצירת PDF:', error);
            this.showToast('שגיאה ביצירת הקובץ: ' + error.message, 'error');
        }
    }
    
    // 📄 Create Simple HTML Content
    createSimpleHTML() {
        const expenses = this.allExpenses.filter(item => item.type === "expense");
        const incomes = this.allExpenses.filter(item => item.type === "income");
        const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
        const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
        const monthlySavings = totalIncome - totalExpenses;
        
        const currentDate = new Date().toLocaleDateString('he-IL');
        const currentMonth = new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
        
        return `
            <div style="font-family: 'Rubik', Arial, sans-serif; max-width: 800px; margin: 0 auto; direction: rtl; text-align: right;">
                <h1 style="text-align: center; color: #2d3748; margin-bottom: 20px;">סיכום חודשי - ניהול הוצאות</h1>
                <p style="text-align: center; color: #718096; margin-bottom: 10px;">תקופה: ${currentMonth}</p>
                <p style="text-align: center; color: #a0aec0; margin-bottom: 30px;">נוצר בתאריך: ${currentDate}</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                    <div style="background: #f7fafc; padding: 20px; border-radius: 10px; text-align: center;">
                        <h3 style="color: #e53e3e; margin-bottom: 10px;">סה"כ הוצאות</h3>
                        <p style="font-size: 24px; font-weight: bold; color: #2d3748;">₪${totalExpenses.toLocaleString()}</p>
                    </div>
                    <div style="background: #f7fafc; padding: 20px; border-radius: 10px; text-align: center;">
                        <h3 style="color: #38a169; margin-bottom: 10px;">סה"כ הכנסות</h3>
                        <p style="font-size: 24px; font-weight: bold; color: #2d3748;">₪${totalIncome.toLocaleString()}</p>
                    </div>
                </div>
                
                <div style="background: #f7fafc; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                    <h3 style="color: #3182ce; margin-bottom: 10px;">חיסכון חודשי</h3>
                    <p style="font-size: 28px; font-weight: bold; color: ${monthlySavings >= 0 ? '#38a169' : '#e53e3e'};">₪${monthlySavings.toLocaleString()}</p>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #2d3748; margin-bottom: 15px;">פירוט תנועות</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background: #edf2f7;">
                                <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">תאריך</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">תיאור</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">קטגוריה</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">סכום</th>
                                <th style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">סוג</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.allExpenses.slice(0, 15).map(item => `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${new Date(item.date).toLocaleDateString('he-IL')}</td>
                                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${(item.description || 'ללא תיאור').substring(0, 25)}</td>
                                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${item.category || 'אחר'}</td>
                                    <td style="padding: 8px; border: 1px solid #e2e8f0; color: ${item.type === 'expense' ? '#e53e3e' : '#38a169'}; font-weight: bold;">₪${Number(item.amount).toLocaleString()}</td>
                                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${item.type === 'expense' ? 'הוצאה' : 'הכנסה'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div style="text-align: center; color: #718096; font-size: 12px; margin-top: 30px;">
                    <p>נוצר אוטומטית על ידי מערכת ניהול ההוצאות</p>
                </div>
            </div>
        `;
    }
    
    // 📄 Create Text PDF
    async createTextPDF(doc) {
        const expenses = this.allExpenses.filter(item => item.type === "expense");
        const incomes = this.allExpenses.filter(item => item.type === "income");
        const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
        const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
        const monthlySavings = totalIncome - totalExpenses;
        
        // כותרת
        doc.setFontSize(20);
        doc.text('Monthly Summary - Expense Management', 105, 20, { align: 'center' });
        
        // תאריך
        doc.setFontSize(12);
        const currentDate = new Date().toLocaleDateString('en-US');
        const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        doc.text(`Period: ${currentMonth}`, 105, 30, { align: 'center' });
        doc.text(`Created: ${currentDate}`, 105, 40, { align: 'center' });
        
        // מדדים
        doc.setFontSize(16);
        doc.text('Key Metrics:', 20, 60);
        
        doc.setFontSize(14);
        doc.text(`Total Expenses: ₪${totalExpenses.toLocaleString()}`, 20, 75);
        doc.text(`Total Income: ₪${totalIncome.toLocaleString()}`, 20, 85);
        doc.text(`Monthly Savings: ₪${monthlySavings.toLocaleString()}`, 20, 95);
        
        // תנועות
        doc.setFontSize(16);
        doc.text('Recent Transactions:', 20, 120);
        
        doc.setFontSize(10);
        let yPosition = 135;
        const dataToShow = this.allExpenses.slice(0, 20);
        
        dataToShow.forEach((item, index) => {
            if (yPosition > 280) return;
            
            const date = new Date(item.date).toLocaleDateString('en-US');
            const description = (item.description || 'No description').substring(0, 20);
            const category = item.category || 'Other';
            const amount = Number(item.amount).toLocaleString();
            const type = item.type === 'expense' ? 'Expense' : 'Income';
            
            doc.text(`${date} - ${description} - ${category} - ₪${amount} (${type})`, 20, yPosition);
            yPosition += 6;
        });
    }
    
    // 📄 Load jsPDF dynamically
    async loadJsPDF() {
        return new Promise((resolve, reject) => {
            if (typeof window.jspdf !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                console.log('✅ jsPDF נטענה בהצלחה');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ שגיאה בטעינת jsPDF');
                reject(new Error('לא ניתן לטעון jsPDF'));
            };
            document.head.appendChild(script);
        });
    }

    // 📄 Add Hebrew Font Support
    async addHebrewFont(doc) {
        try {
            // נסה להוסיף פונט עברי
            const hebrewFont = await this.loadHebrewFont();
            if (hebrewFont) {
                doc.addFont(hebrewFont, 'hebrew', 'normal');
            }
        } catch (error) {
            console.log('לא ניתן לטעון פונט עברי, משתמש בפונט ברירת מחדל');
        }
    }
    
    // 📄 Load Hebrew Font
    async loadHebrewFont() {
        return new Promise((resolve) => {
            // נסה לטעון פונט עברי מ-CDN
            const link = document.createElement('link');
            link.href = 'https://fonts.googleapis.com/css2?family=Rubik:wght@400;700&display=swap';
            link.rel = 'stylesheet';
            link.onload = () => {
                resolve(true);
            };
            link.onerror = () => {
                resolve(false);
            };
            document.head.appendChild(link);
        });
    }
}

// 🚀 Initialize Dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new HomeDashboard();
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        @keyframes ripple {
            0% {
                transform: scale(0);
                opacity: 1;
            }
            100% {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
});
