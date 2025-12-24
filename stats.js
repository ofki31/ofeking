// 📊 Advanced Statistics Dashboard
class AdvancedStatsDashboard {
    constructor() {
        this.user = JSON.parse(localStorage.getItem("user"));
        this.data = [];
        this.charts = {};
        this.currentPeriod = 'current';
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        console.log('🚀 מתחיל אתחול דשבורד סטטיסטיקות מתקדמות...');
        
        if (!this.user || !this.user.id) {
            this.showToast('אין משתמש מחובר. נא להתחבר.', 'error');
            setTimeout(() => window.location.href = "login.html", 2000);
            return;
        }

        this.setupEventListeners();
        this.showLoading(true);
        await this.loadData();
        this.showLoading(false);
    }

    // 🔧 Setup Event Listeners
    setupEventListeners() {
        // Period Filter
        const periodFilter = document.getElementById('periodFilter');
        if (periodFilter) {
            periodFilter.addEventListener('change', (e) => {
                this.currentPeriod = e.target.value;
                this.updatePeriodDisplay();
                this.refreshData();
            });
        }

        // Refresh Button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // Chart Tabs
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const chartType = btn.dataset.chart;
                this.switchChart(chartType);
            });
        });

        // Export Buttons
        const downloadBtn = document.getElementById('downloadPdfBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.exportToPDF());
        }

        const emailBtn = document.getElementById('emailSummaryBtn');
        if (emailBtn) {
            emailBtn.addEventListener('click', () => this.sendEmail());
        }

        // Chart Action Buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.chart-btn')) {
                const btn = e.target.closest('.chart-btn');
                const action = btn.dataset.action;
                this.handleChartAction(action);
            }
        });
    }

    // 📊 Load Data from Server
    async loadData() {
        try {
            console.log('🔄 טוען נתונים מהשרת...');
            console.log('👤 משתמש:', this.user.id);
            
            const response = await fetch(`http://localhost:3000/transactions/${this.user.id}`);
            if (!response.ok) {
                throw new Error(`שגיאת שרת: ${response.status}`);
            }
            
            const responseData = await response.json();
            console.log('📡 תגובה מהשרת:', responseData);
            
            this.data = responseData.success ? responseData.transactions : responseData;
            
            console.log('✅ נתונים נטענו:', this.data.length, 'טרנזקציות');
            console.log('📊 דוגמה לנתונים:', this.data.slice(0, 2));
            
            this.processData();
            this.updateMetrics();
            this.renderCharts();
            this.updateInsights();
            this.updateAnalysis();
            
        } catch (error) {
            console.error('❌ שגיאה בטעינת נתונים:', error);
            this.showToast(`שגיאה בטעינת נתונים: ${error.message}`, 'error');
        }
    }

    // 🔄 Refresh Data
    async refreshData() {
        this.showLoading(true);
        await this.loadData();
        this.showLoading(false);
        this.showToast('הנתונים עודכנו בהצלחה!', 'success');
    }

    // 📅 Process Data Based on Period
    processData() {
        console.log('🔄 מעבד נתונים...');
        console.log('📊 נתונים גולמיים:', this.data.length);
        
        const now = new Date();
        let filteredData = [...this.data];

        switch (this.currentPeriod) {
            case 'current':
                filteredData = this.data.filter(item => {
                    const itemDate = new Date(item.date);
                    return itemDate.getMonth() === now.getMonth() && 
                           itemDate.getFullYear() === now.getFullYear();
                });
                break;
            case 'last3':
                const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                filteredData = this.data.filter(item => new Date(item.date) >= threeMonthsAgo);
                break;
            case 'last6':
                const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                filteredData = this.data.filter(item => new Date(item.date) >= sixMonthsAgo);
                break;
            case 'year':
                const yearStart = new Date(now.getFullYear(), 0, 1);
                filteredData = this.data.filter(item => new Date(item.date) >= yearStart);
                break;
        }

        this.processedData = filteredData;
        console.log('📊 נתונים מעובדים:', this.processedData.length, 'טרנזקציות');
        console.log('📊 דוגמה לנתונים:', this.processedData.slice(0, 2));
    }

    // 📈 Update Metrics
    updateMetrics() {
        const expenses = this.processedData.filter(item => item.type === 'expense');
        const incomes = this.processedData.filter(item => item.type === 'income');
        
        const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
        const totalIncomes = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
        const totalSavings = totalIncomes - totalExpenses;
        const savingsRate = totalIncomes > 0 ? ((totalSavings / totalIncomes) * 100) : 0;

        // Update metric cards
        this.updateMetricCard('total-expenses', totalExpenses, 'expense');
        this.updateMetricCard('total-incomes', totalIncomes, 'income');
        this.updateMetricCard('total-savings', totalSavings, 'savings');
        this.updateMetricCard('savings-rate', savingsRate, 'rate');

        // Update header stats
        this.updateHeaderStats();
    }

    // 💰 Update Metric Card
    updateMetricCard(elementId, value, type) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let formattedValue = '';
        let trend = '+0%';

        switch (type) {
            case 'expense':
            case 'income':
            case 'savings':
                formattedValue = `₪${value.toLocaleString()}`;
                break;
            case 'rate':
                formattedValue = `${value.toFixed(1)}%`;
                break;
        }

        // Add animation
        element.style.transform = 'scale(0.95)';
        element.style.opacity = '0.7';
        
        setTimeout(() => {
            element.textContent = formattedValue;
            element.style.transform = 'scale(1)';
            element.style.opacity = '1';
        }, 200);

        // Update trend (simulated for now)
        const trendElement = document.getElementById(`${elementId.replace('total-', '')}-trend`);
        if (trendElement) {
            const isPositive = Math.random() > 0.3;
            const percentage = Math.floor(Math.random() * 20) + 1;
            trend = isPositive ? `+${percentage}%` : `-${percentage}%`;
            trendElement.textContent = trend;
            trendElement.className = `trend ${isPositive ? 'positive' : 'negative'}`;
        }
    }

    // 📊 Update Header Stats
    updateHeaderStats() {
        const totalTransactions = document.getElementById('total-transactions');
        const activeCategories = document.getElementById('active-categories');
        const currentPeriod = document.getElementById('current-period');

        if (totalTransactions) {
            totalTransactions.textContent = `${this.processedData.length} טרנזקציות`;
        }

        if (activeCategories) {
            const categories = new Set(this.processedData.map(item => item.category));
            activeCategories.textContent = `${categories.size} קטגוריות`;
        }

        if (currentPeriod) {
            const periodNames = {
                'current': 'החודש הנוכחי',
                'last3': '3 חודשים אחרונים',
                'last6': '6 חודשים אחרונים',
                'year': 'השנה הנוכחית'
            };
            currentPeriod.textContent = periodNames[this.currentPeriod];
        }
    }

    // 📊 Render Charts
    renderCharts() {
        this.renderMonthlyChart();
        this.renderCategoriesChart();
        this.renderTrendsChart();
        this.renderComparisonChart();
    }

    // 📈 Render Monthly Chart
    renderMonthlyChart() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;

        const monthlyData = this.getMonthlyData();
        
        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }

        this.charts.monthly = new Chart(ctx, {
      type: 'bar',
      data: {
                labels: monthlyData.labels,
        datasets: [
                    {
                        label: 'הוצאות',
                        data: monthlyData.expenses,
                        backgroundColor: 'rgba(245, 101, 101, 0.8)',
                        borderColor: '#f56565',
                        borderWidth: 2
                    },
                    {
                        label: 'הכנסות',
                        data: monthlyData.incomes,
                        backgroundColor: 'rgba(72, 187, 120, 0.8)',
                        borderColor: '#48bb78',
                        borderWidth: 2
                    }
        ]
      },
      options: {
        responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { family: 'Rubik', size: 14 },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ₪${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
        scales: {
          y: {
            beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₪' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // 🎨 Render Categories Chart
    renderCategoriesChart() {
        const ctx = document.getElementById('categoriesChart');
        if (!ctx) return;

        const categoryData = this.getCategoryData();
        
        if (this.charts.categories) {
            this.charts.categories.destroy();
        }

        this.charts.categories = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.values,
                    backgroundColor: this.getCategoryColors(categoryData.labels.length),
                    borderWidth: 3,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { family: 'Rubik', size: 12 },
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ₪${context.parsed.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // 📈 Render Trends Chart
    renderTrendsChart() {
        const ctx = document.getElementById('trendsChart');
        if (!ctx) return;

        const trendsData = this.getTrendsData();
        
        if (this.charts.trends) {
            this.charts.trends.destroy();
        }

        this.charts.trends = new Chart(ctx, {
      type: 'line',
      data: {
                labels: trendsData.labels,
                datasets: trendsData.datasets
      },
      options: {
        responsive: true,
                maintainAspectRatio: false,
        plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { family: 'Rubik', size: 12 },
                            usePointStyle: true
                        }
                    }
        },
        scales: {
          y: {
            beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₪' + value.toLocaleString();
                            }
                        }
          }
        }
      }
    });
    }

    // ⚖️ Render Comparison Chart
    renderComparisonChart() {
        const ctx = document.getElementById('comparisonChart');
        if (!ctx) return;

        const comparisonData = this.getComparisonData();
        
        if (this.charts.comparison) {
            this.charts.comparison.destroy();
        }

        this.charts.comparison = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: comparisonData.labels,
                datasets: [{
                    label: 'התקופה הנוכחית',
                    data: comparisonData.current,
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: '#667eea',
                    borderWidth: 2,
                    pointBackgroundColor: '#667eea'
                }, {
                    label: 'התקופה הקודמת',
                    data: comparisonData.previous,
                    backgroundColor: 'rgba(245, 101, 101, 0.2)',
                    borderColor: '#f56565',
                    borderWidth: 2,
                    pointBackgroundColor: '#f56565'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { family: 'Rubik', size: 12 }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₪' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // 📊 Get Monthly Data
    getMonthlyData() {
        const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
                       'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
        const expenses = new Array(12).fill(0);
        const incomes = new Array(12).fill(0);

        this.processedData.forEach(item => {
            const date = new Date(item.date);
            const month = date.getMonth();
            const amount = Number(item.amount);

            if (item.type === 'expense') {
                expenses[month] += amount;
            } else {
                incomes[month] += amount;
            }
        });

        return { labels: months, expenses, incomes };
    }

    // 🏷️ Get Category Data
    getCategoryData() {
        const categoryMap = {};
        
        this.processedData
            .filter(item => item.type === 'expense')
            .forEach(item => {
                const category = item.category || 'אחר';
                categoryMap[category] = (categoryMap[category] || 0) + Number(item.amount);
            });

        const sortedCategories = Object.entries(categoryMap)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8); // Top 8 categories

        return {
            labels: sortedCategories.map(([category]) => category),
            values: sortedCategories.map(([, amount]) => amount)
        };
    }

    // 📈 Get Trends Data
    getTrendsData() {
        const categories = [...new Set(this.processedData
            .filter(item => item.type === 'expense')
            .map(item => item.category))].slice(0, 5);

        const datasets = categories.map((category, index) => {
            const monthlyData = new Array(12).fill(0);
            
            this.processedData
                .filter(item => item.type === 'expense' && item.category === category)
                .forEach(item => {
                    const month = new Date(item.date).getMonth();
                    monthlyData[month] += Number(item.amount);
                });

            return {
                label: category,
                data: monthlyData,
                borderColor: this.getCategoryColor(index),
                backgroundColor: this.getCategoryColor(index, 0.1),
                tension: 0.4,
                fill: false
            };
        });

        return {
            labels: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
                    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
            datasets
        };
    }

    // ⚖️ Get Comparison Data
    getComparisonData() {
        const metrics = ['הוצאות מזון', 'הוצאות תחבורה', 'הוצאות בילויים', 'חשבונות', 'קניות'];
        const current = [1200, 800, 600, 400, 300]; // Simulated data
        const previous = [1000, 900, 500, 450, 250]; // Simulated data

        return { labels: metrics, current, previous };
    }

    // 🎨 Get Category Colors
    getCategoryColors(count) {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
            '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
        ];
        return colors.slice(0, count);
    }

    getCategoryColor(index, alpha = 1) {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
            '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
        ];
        return colors[index % colors.length];
    }

    // 🔄 Switch Chart
    switchChart(chartType) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-chart="${chartType}"]`).classList.add('active');

        // Update chart wrappers
        document.querySelectorAll('.chart-wrapper').forEach(wrapper => {
            wrapper.classList.remove('active');
        });
        document.getElementById(`${chartType}-chart`).classList.add('active');
    }

    // 💡 Update Insights
    updateInsights() {
        const expenses = this.processedData.filter(item => item.type === 'expense');
        
        // Highest expense
        const highestExpense = expenses.reduce((max, item) => 
            Number(item.amount) > Number(max.amount) ? item : max, { amount: 0 });
        
        document.getElementById('highest-expense').textContent = 
            highestExpense.amount > 0 ? 
            `${highestExpense.description}: ₪${Number(highestExpense.amount).toLocaleString()}` : 
            'אין נתונים';

        // Most expensive day
        const dailyExpenses = {};
        expenses.forEach(item => {
            const date = item.date;
            dailyExpenses[date] = (dailyExpenses[date] || 0) + Number(item.amount);
        });
        
        const expensiveDay = Object.entries(dailyExpenses)
            .reduce((max, [date, amount]) => amount > max.amount ? { date, amount } : max, { date: '', amount: 0 });
        
        document.getElementById('expensive-day').textContent = 
            expensiveDay.amount > 0 ? 
            `${new Date(expensiveDay.date).toLocaleDateString('he-IL')}: ₪${expensiveDay.amount.toLocaleString()}` : 
            'אין נתונים';

        // Most common category
        const categoryCount = {};
        expenses.forEach(item => {
            const category = item.category || 'אחר';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        
        const commonCategory = Object.entries(categoryCount)
            .reduce((max, [category, count]) => count > max.count ? { category, count } : max, { category: '', count: 0 });
        
        document.getElementById('common-category').textContent = 
            commonCategory.count > 0 ? 
            `${commonCategory.category}: ${commonCategory.count} פעמים` : 
            'אין נתונים';

        // General trend
        const monthlyExpenses = this.getMonthlyData().expenses;
        const recentMonths = monthlyExpenses.slice(-3);
        const trend = recentMonths[2] > recentMonths[0] ? 'עולה' : 'יורדת';
        
        document.getElementById('general-trend').textContent = 
            `המגמה ${trend} ב-3 החודשים האחרונים`;
    }

    // 🔍 Update Analysis
    updateAnalysis() {
        // Daily statistics
        const dailyStats = this.calculateDailyStats();
        document.getElementById('daily-stats').innerHTML = `
            <p><strong>ממוצע יומי:</strong> ₪${dailyStats.average.toLocaleString()}</p>
            <p><strong>יום יקר ביותר:</strong> ₪${dailyStats.max.toLocaleString()}</p>
            <p><strong>יום זול ביותר:</strong> ₪${dailyStats.min.toLocaleString()}</p>
        `;

        // Weekly comparison
        const weeklyStats = this.calculateWeeklyStats();
        document.getElementById('weekly-stats').innerHTML = `
            <p><strong>ממוצע שבועי:</strong> ₪${weeklyStats.average.toLocaleString()}</p>
            <p><strong>שבוע יקר ביותר:</strong> ₪${weeklyStats.max.toLocaleString()}</p>
            <p><strong>שינוי מהשבוע הקודם:</strong> ${weeklyStats.change}%</p>
        `;

        // Efficiency metrics
        const efficiency = this.calculateEfficiency();
        document.getElementById('efficiency-stats').innerHTML = `
            <p><strong>יעילות חיסכון:</strong> ${efficiency.savingsRate.toFixed(1)}%</p>
            <p><strong>יחס הוצאות/הכנסות:</strong> ${efficiency.expenseRatio.toFixed(1)}%</p>
            <p><strong>ציון יעילות:</strong> ${efficiency.score}/100</p>
        `;

        // Predictions
        const predictions = this.generatePredictions();
        document.getElementById('predictions').innerHTML = `
            <p><strong>תחזית הוצאות החודש הבא:</strong> ₪${predictions.nextMonth.toLocaleString()}</p>
            <p><strong>תחזית חיסכון שנתי:</strong> ₪${predictions.yearlySavings.toLocaleString()}</p>
            <p><strong>המלצה:</strong> ${predictions.recommendation}</p>
        `;
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

    // 📊 Update Additional Stats
    updateAdditionalStats(stats) {
        // This function can be used to update additional statistics if needed
        console.log('Additional stats updated:', stats);
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

    // 📊 Calculate Daily Statistics
    calculateDailyStats() {
        const expenses = this.processedData.filter(item => item.type === 'expense');
        const dailyAmounts = expenses.map(item => Number(item.amount));
        
        return {
            average: dailyAmounts.length > 0 ? dailyAmounts.reduce((a, b) => a + b, 0) / dailyAmounts.length : 0,
            max: Math.max(...dailyAmounts, 0),
            min: Math.min(...dailyAmounts, 0)
        };
    }

    // 📅 Calculate Weekly Statistics
    calculateWeeklyStats() {
        // Simplified weekly calculation
        const expenses = this.processedData.filter(item => item.type === 'expense');
        const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
        const weeks = Math.max(1, Math.ceil(this.processedData.length / 7));
        
        return {
            average: total / weeks,
            max: total,
            change: Math.floor(Math.random() * 20) - 10 // Simulated change
        };
    }

    // 💰 Calculate Efficiency
    calculateEfficiency() {
        const expenses = this.processedData.filter(item => item.type === 'expense');
        const incomes = this.processedData.filter(item => item.type === 'income');
        
        const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
        const totalIncomes = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
        
        const savingsRate = totalIncomes > 0 ? ((totalIncomes - totalExpenses) / totalIncomes) * 100 : 0;
        const expenseRatio = totalIncomes > 0 ? (totalExpenses / totalIncomes) * 100 : 0;
        const score = Math.max(0, Math.min(100, 100 - expenseRatio + savingsRate));
        
        return { savingsRate, expenseRatio, score };
    }

    // 🔮 Generate Predictions
    generatePredictions() {
        const expenses = this.processedData.filter(item => item.type === 'expense');
        const avgExpense = expenses.reduce((sum, item) => sum + Number(item.amount), 0) / Math.max(1, expenses.length);
        
        const nextMonth = avgExpense * 30;
        const yearlySavings = (avgExpense * 12) * 0.2; // Assume 20% savings
        
        let recommendation = 'שמור על הרגלי ההוצאות הנוכחיים';
        if (avgExpense > 5000) {
            recommendation = 'שקול לצמצם הוצאות לא חיוניות';
        } else if (avgExpense < 2000) {
            recommendation = 'אתה עושה עבודה מצוינת בחיסכון!';
        }
        
        return { nextMonth, yearlySavings, recommendation };
    }

    // 📄 Export to PDF
    async exportToPDF() {
        try {
            this.showToast('מייצא ל-PDF...', 'info');
            
            // וידוא שהנתונים נטענים
            if (!this.processedData || this.processedData.length === 0) {
                console.log('🔄 אין נתונים מעובדים, טוען נתונים מחדש...');
                await this.loadData();
                
                // בדיקה נוספת אחרי טעינה
                if (!this.processedData || this.processedData.length === 0) {
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
            const filename = `סטטיסטיקות_${new Date().toLocaleDateString('he-IL').replace(/\//g, '-')}.pdf`;
            doc.save(filename);
            
            this.showToast('הקובץ יוצא בהצלחה!', 'success');
            
        } catch (error) {
            console.error('שגיאה ביצירת PDF:', error);
            this.showToast('שגיאה ביצירת הקובץ: ' + error.message, 'error');
        }
    }
    
    // 📄 Create Simple HTML Content
    createSimpleHTML() {
        const expenses = this.processedData.filter(item => item.type === "expense");
        const incomes = this.processedData.filter(item => item.type === "income");
        const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
        const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
        const monthlySavings = totalIncome - totalExpenses;
        
        const currentDate = new Date().toLocaleDateString('he-IL');
        const currentMonth = new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
        
        return `
            <div style="font-family: 'Rubik', Arial, sans-serif; max-width: 800px; margin: 0 auto; direction: rtl; text-align: right;">
                <h1 style="text-align: center; color: #2d3748; margin-bottom: 20px;">דוח סטטיסטיקות מתקדמות</h1>
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
                            ${this.processedData.slice(0, 15).map(item => `
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
                    <p>נוצר אוטומטית על ידי מערכת ניהול ההוצאות המתקדמת</p>
                </div>
            </div>
        `;
    }
    
    // 📄 Create Text PDF
    async createTextPDF(doc) {
        const expenses = this.processedData.filter(item => item.type === "expense");
        const incomes = this.processedData.filter(item => item.type === "income");
        const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
        const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
        const monthlySavings = totalIncome - totalExpenses;
        
        // כותרת
        doc.setFontSize(20);
        doc.text('Monthly Statistics Report', 105, 20, { align: 'center' });
        
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
        const dataToShow = this.processedData.slice(0, 20);
        
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

    // 📧 Send Email
    async sendEmail() {
        try {
            this.showToast('שולח למייל...', 'info');
            
            const response = await fetch('http://localhost:3000/send-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.user.email,
                    summaryHtml: document.querySelector('.dashboard-container').innerHTML
                })
            });
            
            const result = await response.json();
            this.showToast(result.message || 'הסיכום נשלח בהצלחה!', 'success');
            
        } catch (error) {
            console.error('שגיאה בשליחת מייל:', error);
            this.showToast('שגיאה בשליחת המייל', 'error');
        }
    }

    // 🎯 Handle Chart Actions
    handleChartAction(action) {
        switch (action) {
            case 'zoom':
                this.showToast('פונקציית זום תתווסף בקרוב', 'info');
                break;
            case 'download':
                this.downloadChart();
                break;
        }
    }

    // 📥 Download Chart
    downloadChart() {
        const activeChart = document.querySelector('.chart-wrapper.active canvas');
        if (activeChart) {
            const link = document.createElement('a');
            link.download = `chart_${new Date().toISOString().split('T')[0]}.png`;
            link.href = activeChart.toDataURL();
            link.click();
            this.showToast('הגרף יורד בהצלחה!', 'success');
        }
    }

    // 🔄 Ensure Charts are Rendered
    async ensureChartsRendered() {
        return new Promise((resolve) => {
            // וידוא שהגרפים מרונדרים
            setTimeout(() => {
                const charts = document.querySelectorAll('canvas');
                let renderedCount = 0;
                
                charts.forEach(canvas => {
                    if (canvas.width > 0 && canvas.height > 0) {
                        renderedCount++;
                    }
                });
                
                console.log(`✅ ${renderedCount} גרפים מרונדרים`);
                resolve();
            }, 500);
        });
    }



    // 📅 Update Period Display
    updatePeriodDisplay() {
        const periodNames = {
            'current': 'החודש הנוכחי',
            'last3': '3 חודשים אחרונים',
            'last6': '6 חודשים אחרונים',
            'year': 'השנה הנוכחית'
        };
        
        const element = document.getElementById('current-period');
        if (element) {
            element.textContent = periodNames[this.currentPeriod];
        }
    }



    // 🔄 Show Loading State
    showLoading(show) {
        this.isLoading = show;
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    // 🍞 Show Toast Notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
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
        container.appendChild(toast);

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

// 🚀 Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedStatsDashboard();
});
