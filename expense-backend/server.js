const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

// 🚀 יצירת אפליקציית Express
const app = express();

// 🔧 הגדרת middleware
app.use(cors());
app.use(bodyParser.json());

const requiredEnvVars = ["MONGODB_URI", "EMAIL_USER", "EMAIL_PASS"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  process.exit(1);
}

// 📦 חיבור ל־MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI;

// From MongoDB Node.js Driver v4 onwards there is no need for useNewUrlParser/useUnifiedTopology
// so we call mongoose.connect only with the URI itself.
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");
    console.log("🌐 Database: MongoDB Atlas");
  })
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB:", err.message);
    process.exit(1);
  });

// 🧍 סכמת משתמש
const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "שם המשתמש הוא שדה חובה"],
    trim: true,
    minlength: [2, "השם חייב להכיל לפחות 2 תווים"]
  },
  email: { 
    type: String, 
    unique: true, 
    required: [true, "אימייל הוא שדה חובה"],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "אנא הזן אימייל תקין"]
  },
  password: { 
    type: String, 
    required: [true, "סיסמה היא שדה חובה"],
    minlength: [6, "הסיסמה חייבת להכיל לפחות 6 תווים"]
  },
  isAdmin: { 
    type: Boolean, 
    default: false 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model("User", UserSchema);

// 💰 סכמת טרנזקציה (הוצאה/הכנסה)
const TransactionSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: [true, "מזהה משתמש הוא שדה חובה"] 
  },
  type: { 
    type: String, 
    enum: ['expense', 'income'], 
    required: [true, "סוג הטרנזקציה הוא שדה חובה"] 
  },
  description: { 
    type: String, 
    required: [true, "תיאור הוא שדה חובה"],
    trim: true,
    maxlength: [100, "התיאור לא יכול להיות ארוך מ-100 תווים"]
  },
  amount: { 
    type: Number, 
    required: [true, "סכום הוא שדה חובה"],
    min: [0, "הסכום לא יכול להיות שלילי"]
  },
  category: { 
    type: String, 
    required: [true, "קטגוריה היא שדה חובה"],
    trim: true
  },
  date: { 
    type: String, 
    required: [true, "תאריך הוא שדה חובה"] 
  },
  isOutlier: { 
    type: Boolean, 
    default: false 
  },
  location: {
    latitude: { 
      type: Number, 
      min: -90, 
      max: 90 
    },
    longitude: { 
      type: Number, 
      min: -180, 
      max: 180 
    },
    address: { 
      type: String, 
      trim: true 
    },
    placeName: { 
      type: String, 
      trim: true 
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Transaction = mongoose.model("Transaction", TransactionSchema);

// 🎯 סכמת העדפות תקציב
const BudgetPreferenceSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: [true, "מזהה משתמש הוא שדה חובה"] 
  },
  goals: [{ 
    category: { 
      type: String, 
      required: true 
    }, 
    goal: { 
      type: String, 
      enum: ['less', 'more'], 
      required: true 
    } 
  }],
  habits: [{ 
    description: { 
      type: String, 
      required: true 
    }, 
    amount: { 
      type: Number, 
      required: true,
      min: 0 
    }, 
    frequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly'], 
      required: true 
    } 
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const BudgetPreference = mongoose.model("BudgetPreference", BudgetPreferenceSchema);

// 📧 הגדרת שירות המייל
const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ✅ פונקציית שליחת סיכום למייל
async function sendMonthlySummary(to, subject, htmlContent) {
  try {
    const mailOptions = {
      from: `"אפליקציית הוצאות" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully to: ${to}`);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw error;
  }
}

// 🧮 פונקציות עזר לסטטיסטיקות
const getAverage = (values) => {
  if (!values || values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

const getStdDev = (values) => {
  if (!values || values.length === 0) return 0;
  const avg = getAverage(values);
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
};

// 🔍 פונקציית זיהוי חריגות מתקדמת
const detectOutliers = (expense, statsByCategory, statsByDay) => {
  const { amount, category, date, type } = expense;

  // רק הוצאות נבדקות לחריגות
  if (type !== "expense") {
    return { isOutlier: false, reasons: [], confidence: 0 };
  }
  
  const day = new Date(date).getDay(); // 0=ראשון, 6=שבת
  const absoluteThreshold = 300; // רף מוחלט
  const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

  let isOutlier = false;
  let reasons = [];
  let confidence = 0;

  // 📊 בדיקה לפי קטגוריה
  if (statsByCategory[category] && statsByCategory[category].values.length >= 5) {
    const values = statsByCategory[category].values;
    const avg = getAverage(values);
    const std = getStdDev(values);
    const zScore = (amount - avg) / std;

    if (zScore > 2) {
      isOutlier = true;
      confidence += 0.4;
      reasons.push(
        `📊 חריגה מהקטגוריה '${category}': ממוצע ${avg.toFixed(2)} ₪, סטיית תקן ${std.toFixed(2)} ₪`
      );
    }
  }

  // 📆 בדיקה לפי יום בשבוע
  if (statsByDay[day] && statsByDay[day].values.length >= 5) {
    const values = statsByDay[day].values;
    const avg = getAverage(values);
    const std = getStdDev(values);
    const zScore = (amount - avg) / std;

    if (zScore > 2) {
      isOutlier = true;
      confidence += 0.3;
      reasons.push(
        `📅 חריגה ביום ${dayNames[day]}: ממוצע ${avg.toFixed(2)} ₪, סטיית תקן ${std.toFixed(2)} ₪`
      );
    }
  }

  // 🔴 בדיקה לפי רף מוחלט
  if (amount > absoluteThreshold) {
    isOutlier = true;
    confidence += 0.3;
    reasons.push(`⚠️ הסכום גבוה מהרף הקבוע של ${absoluteThreshold} ₪`);
  }

  return { isOutlier, reasons, confidence: Math.min(confidence, 1) };
};

// 📈 איסוף סטטיסטיקות משתמש
const collectUserStats = async (userId) => {
  try {
    const transactions = await Transaction.find({ userId });
    const statsByCategory = {};
    const statsByDay = {};

    transactions.forEach(tx => {
      const { category, amount, date, type } = tx;
      if (type !== "expense") return;

      // סטטיסטיקות לפי קטגוריה
      if (!statsByCategory[category]) {
        statsByCategory[category] = { total: 0, count: 0, values: [] };
      }
      statsByCategory[category].total += amount;
      statsByCategory[category].count++;
      statsByCategory[category].values.push(amount);

      // סטטיסטיקות לפי יום בשבוע
      const day = new Date(date).getDay();
      if (!statsByDay[day]) {
        statsByDay[day] = { total: 0, count: 0, values: [] };
      }
      statsByDay[day].total += amount;
      statsByDay[day].count++;
      statsByDay[day].values.push(amount);
    });

    return { statsByCategory, statsByDay };
  } catch (error) {
    console.error("❌ Error collecting statistics:", error.message);
    return { statsByCategory: {}, statsByDay: {} };
  }
};

// 🔐 Middleware לאימות משתמש
const authenticateUser = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(401).json({ message: "מזהה משתמש נדרש" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "משתמש לא נמצא" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Error authenticating user:", error.message);
    res.status(500).json({ message: "שגיאה באימות משתמש" });
  }
};

// 🔐 Middleware לאימות אדמין
const authenticateAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(401).json({ message: "מזהה משתמש נדרש" });
    }
    
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "גישה נדחתה - נדרשים הרשאות אדמין" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Error authenticating admin:", error.message);
    res.status(500).json({ message: "שגיאה באימות אדמין" });
  }
};

// 📧 שליחת סיכום חודשי במייל
app.post("/send-summary", async (req, res) => {
  const { email, summaryHtml } = req.body;

  try {
    await sendMonthlySummary(email, "הסיכום החודשי שלך", summaryHtml);
    res.json({ 
      success: true,
      message: "המייל נשלח בהצלחה! 📧" 
    });
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    res.status(500).json({ 
      success: false,
      message: "שגיאה בשליחת המייל" 
    });
  }
});

// ✅ הרשמת משתמש חדש
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // בדיקה אם המשתמש כבר קיים
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "אימייל זה כבר קיים במערכת" 
      });
    }

    // הצפנת הסיסמה
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // הגדרת אדמין לפי אימייל
    const isAdmin = email === "ofek1284@gmail.com";

    // יצירת משתמש חדש
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      isAdmin 
    });
    
    await newUser.save();

    res.status(201).json({ 
      success: true,
      message: "נרשמת בהצלחה! 🎉",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin
      }
    });
  } catch (error) {
    console.error("❌ Error during registration:", error.message);
    res.status(500).json({ 
      success: false,
      message: "שגיאה בשרת - אנא נסה שוב" 
    });
  }
});

// 🔑 התחברות משתמש
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // חיפוש המשתמש
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "אימייל או סיסמה שגויים" 
      });
    }

    // בדיקת הסיסמה
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: "אימייל או סיסמה שגויים" 
      });
    }

    res.json({
      success: true,
      message: "התחברת בהצלחה! 👋",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error("❌ Error during login:", error.message);
    res.status(500).json({ 
      success: false,
      message: "שגיאה בשרת - אנא נסה שוב" 
    });
  }
});

// ➕ הוספת טרנזקציה חדשה
app.post("/add-transaction", authenticateUser, async (req, res) => {
  const { userId, type, description, amount, category, date, location } = req.body;

  try {
    // 🧠 איסוף סטטיסטיקות מהעבר
    const { statsByCategory, statsByDay } = await collectUserStats(userId);

    // 🧪 זיהוי חריגות
    const expense = { amount, category, date, type };
    const { isOutlier, reasons, confidence } = detectOutliers(expense, statsByCategory, statsByDay);

    // 📝 יצירת טרנזקציה חדשה
    const newTransaction = new Transaction({
      userId,
      type,
      description,
      amount,
      category,
      date,
      isOutlier,
      location
    });

    await newTransaction.save();

    // 📤 החזרת התוצאה
    res.status(201).json({
      success: true,
      message: "הטרנזקציה נוספה בהצלחה! ✅",
      transaction: newTransaction,
      isOutlier,
      reasons,
      confidence
    });

  } catch (error) {
    console.error("❌ Error adding transaction:", error.message);
    res.status(500).json({ 
      success: false,
      message: "שגיאה בשמירת הטרנזקציה" 
    });
  }
});

// 📋 שליפת טרנזקציות לפי משתמש
app.get("/transactions/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const transactions = await Transaction.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error("❌ Error fetching transactions:", error.message);
    res.status(500).json({ 
      success: false,
      message: "שגיאה בשליפת הטרנזקציות" 
    });
  }
});

// ❌ מחיקת טרנזקציה
app.delete("/delete-transaction/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    // בדיקה שהטרנזקציה שייכת למשתמש
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ 
        success: false,
        message: "הטרנזקציה לא נמצאה" 
      });
    }

    if (transaction.userId !== userId) {
      return res.status(403).json({ 
        success: false,
        message: "אין לך הרשאה למחוק טרנזקציה זו" 
      });
    }

    await Transaction.findByIdAndDelete(id);

    res.json({ 
      success: true,
      message: "הטרנזקציה נמחקה בהצלחה! 🗑️" 
    });
  } catch (error) {
    console.error("❌ Error deleting transaction:", error.message);
    res.status(500).json({ 
      success: false,
      message: "שגיאה במחיקת הטרנזקציה" 
    });
  }
});

// 🔍 שליפת מידע על משתמשים (אדמין בלבד)
app.get("/admin/users-data", authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }).select('-password');
    const transactions = await Transaction.find();

    const userData = users.map(user => {
      const userTransactions = transactions.filter(t => t.userId === String(user._id));
      const totalExpenses = userTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        totalTransactions: userTransactions.length,
        totalExpenses,
        lastActivity: userTransactions.length > 0 ? 
          Math.max(...userTransactions.map(t => new Date(t.date))) : null
      };
    });

    res.json({
      success: true,
      users: userData,
      totalUsers: userData.length
    });
  } catch (error) {
    console.error("❌ Error fetching users data:", error.message);
    res.status(500).json({ 
      success: false,
      message: "שגיאה בשליפת נתוני המשתמשים" 
    });
  }
});



// 🔄 הפיכת משתמש לאדמין
app.post("/admin/make-admin", authenticateAdmin, async (req, res) => {
  const { email } = req.body;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { isAdmin: true },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: "משתמש לא נמצא" 
      });
    }

    res.json({ 
      success: true,
      message: `${email} עודכן כאדמין בהצלחה! 👑` 
    });
  } catch (error) {
    console.error("❌ Error updating user:", error.message);
    res.status(500).json({ 
      success: false,
      message: "שגיאה בעדכון המשתמש" 
    });
  }
});

// 💰 שמירת העדפות תקציב
app.post("/budget-preferences", authenticateUser, async (req, res) => {
  try {
    const { userId, goals, habits } = req.body;

    let preferences = await BudgetPreference.findOne({ userId });
    
    if (preferences) {
      preferences.goals = goals;
      preferences.habits = habits;
      preferences.updatedAt = new Date();
      await preferences.save();
    } else {
      preferences = await BudgetPreference.create({ 
        userId, 
        goals, 
        habits 
      });
    }

    res.json({ 
      success: true,
      message: "העדפות התקציב נשמרו בהצלחה! 💾",
      preferences 
    });
  } catch (error) {
    console.error("❌ Error saving budget preferences:", error.message);
    res.status(500).json({ 
      success: false,
      message: "שגיאה בשמירת העדפות התקציב" 
    });
  }
});

// 📋 שליפת העדפות תקציב
app.get("/budget-preferences/:userId", async (req, res) => {
  try {
    const preferences = await BudgetPreference.findOne({ userId: req.params.userId });
    res.json({
      success: true,
      preferences: preferences || { goals: [], habits: [] }
    });
  } catch (error) {
    console.error("❌ Error fetching budget preferences:", error.message);
    res.status(500).json({ 
      success: false,
      message: "שגיאה בשליפת העדפות התקציב" 
    });
  }
});

// 📊 חישוב סיכום תקציב לפי קטגוריה
app.get("/budget-summary/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // טעינת כל התנועות
    const allTransactions = await Transaction.find({ userId });
    const preferences = await BudgetPreference.findOne({ userId });
    
    console.log('📊 Total transactions found:', allTransactions.length);

    // סינון רק הוצאות
    const expenses = allTransactions.filter(tx => {
      return tx && tx.type === 'expense' && tx.amount && Number(tx.amount) > 0;
    });

    console.log('📊 Expenses found:', expenses.length);
    if (expenses.length > 0) {
      console.log('📊 First expense:', {
        category: expenses[0].category,
        amount: expenses[0].amount,
        date: expenses[0].date,
        type: expenses[0].type
      });
    }

    // חישוב הכנסות ממוצעות
    const incomes = allTransactions.filter(tx => tx && tx.type === 'income' && tx.amount > 0);
    const monthlyIncomes = {};
    incomes.forEach(tx => {
      if (tx.date) {
        const date = new Date(tx.date);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyIncomes[monthKey] = (monthlyIncomes[monthKey] || 0) + Number(tx.amount);
        }
      }
    });
    const avgIncome = Object.keys(monthlyIncomes).length > 0
      ? getAverage(Object.values(monthlyIncomes))
      : 0;

    // קיבוץ הוצאות לפי קטגוריה
    const categoryData = {};
    
    expenses.forEach(expense => {
      // קבלת קטגוריה
      let category = expense.category;
      if (!category || typeof category !== 'string') {
        category = 'אחר';
      } else {
        category = category.trim();
        if (category === '') {
          category = 'אחר';
        }
      }

      // יצירת מבנה לקטגוריה אם לא קיים
      if (!categoryData[category]) {
        categoryData[category] = {
          total: 0,
          months: {},
          count: 0
        };
      }

      // הוספת הסכום
      const amount = Number(expense.amount) || 0;
      if (amount > 0 && expense.date) {
        const date = new Date(expense.date);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          categoryData[category].total += amount;
          categoryData[category].months[monthKey] = (categoryData[category].months[monthKey] || 0) + amount;
          categoryData[category].count++;
        }
      }
    });

    console.log('📊 Categories found:', Object.keys(categoryData));

    // חישוב תקציב לכל קטגוריה
    const goalAdjustments = preferences?.goals || [];
    const habits = preferences?.habits || [];
    const categoryBudgets = [];
    let totalBudget = 0;

    Object.keys(categoryData).forEach(category => {
      const data = categoryData[category];
      const monthlyAmounts = Object.values(data.months);
      
      // ממוצע חודשי
      const averageExpense = monthlyAmounts.length > 0
        ? getAverage(monthlyAmounts)
        : data.total; // אם אין חודשים, נשתמש בסכום הכולל

      if (averageExpense > 0) {
        let budget = averageExpense;
        let goalAdjustment = 0;
        let habitCost = 0;

        // התאמה לפי יעדים
        const goal = goalAdjustments.find(g => 
          g.category && g.category.trim().toLowerCase() === category.toLowerCase()
        );
        
        if (goal) {
          if (goal.goal === "less") {
            goalAdjustment = -averageExpense * 0.2;
            budget += goalAdjustment;
          } else if (goal.goal === "more") {
            goalAdjustment = averageExpense * 0.1;
            budget += goalAdjustment;
          }
        }

        // חישוב עלות הרגלים
        habits.forEach(habit => {
          if (habit.description && 
              habit.description.toLowerCase().includes(category.toLowerCase())) {
            const multiplier = habit.frequency === "daily" ? 30 :
                             habit.frequency === "weekly" ? 4 : 1;
            const monthlyHabitCost = habit.amount * multiplier;
            habitCost += monthlyHabitCost;
            budget += monthlyHabitCost;
          }
        });

        budget = Math.max(0, budget);

        categoryBudgets.push({
          category,
          budget: Math.round(budget),
          averageExpense: Math.round(averageExpense),
          goalAdjustment: Math.round(goalAdjustment),
          habitCost: Math.round(habitCost),
          transactions: data.count
        });

        totalBudget += budget;
      }
    });

    // מיון לפי תקציב (גבוה לנמוך)
    categoryBudgets.sort((a, b) => b.budget - a.budget);

    // חישוב חיסכון צפוי
    const expectedSavings = avgIncome > 0 ? avgIncome - totalBudget : 0;

    // יצירת הערות
    const notes = [];
    if (categoryBudgets.length === 0) {
      notes.push("📝 הוסף הוצאות כדי לקבל תקציב מומלץ לפי קטגוריה.");
    } else {
      notes.push(`✅ נמצאו ${categoryBudgets.length} קטגוריות עם הוצאות.`);
    }

    if (expectedSavings < 0) {
      notes.push("⚠️ ההוצאות הצפויות גבוהות מההכנסה. שקול לצמצם הוצאות.");
    } else if (expectedSavings > 0) {
      notes.push(`💚 חיסכון צפוי של ${Math.round(expectedSavings).toLocaleString()} ₪ לחודש.`);
    }

    console.log('✅ Final result:', {
      totalBudget: Math.round(totalBudget),
      categoryBudgetsCount: categoryBudgets.length,
      categories: categoryBudgets.map(c => c.category)
    });

    res.json({
      success: true,
      summary: {
        totalBudget: Math.round(totalBudget),
        categoryBudgets,
        expectedIncome: Math.round(avgIncome),
        expectedSavings: Math.round(expectedSavings),
        notes
      }
    });

  } catch (error) {
    console.error("❌ Error calculating budget:", error.message);
    res.status(500).json({ 
      success: false,
      message: "שגיאה בחישוב התקציב" 
    });
  }
});

// 🏥 Server health check
app.get("/health", (req, res) => {
  res.json({ 
    success: true,
    message: "Server is healthy 🟢",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server started successfully");
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`⏰ Start time: ${new Date().toLocaleString('he-IL')}`);
  console.log("📊 Expense management system is ready");
});

// 🔄 Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server (SIGINT)...');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server (SIGTERM)...');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});
