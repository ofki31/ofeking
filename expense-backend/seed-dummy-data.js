const mongoose = require("mongoose");

// חיבור ל-MongoDB
const MONGODB_URI = "mongodb+srv://qrsynthw:Asd123@cluster0.sa3yrfh.mongodb.net/expensesDB?retryWrites=true&w=majority&appName=Cluster0";

// סכמת Transaction
const TransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['expense', 'income'], required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: String, required: true },
  isOutlier: { type: Boolean, default: false },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    placeName: String
  },
  createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model("Transaction", TransactionSchema);

// נתוני דמה - קטגוריות הוצאות
const expenseCategories = {
  'אוכל': [
    { desc: 'קניות בסופר', amount: [150, 300] },
    { desc: 'מסעדה', amount: [80, 200] },
    { desc: 'קפה', amount: [15, 35] },
    { desc: 'אוכל מוכן', amount: [50, 120] }
  ],
  'תחבורה': [
    { desc: 'דלק', amount: [200, 400] },
    { desc: 'חניה', amount: [20, 50] },
    { desc: 'תחבורה ציבורית', amount: [30, 90] },
    { desc: 'תיקון רכב', amount: [300, 800] }
  ],
  'בילויים': [
    { desc: 'קולנוע', amount: [50, 120] },
    { desc: 'מסעדה', amount: [150, 350] },
    { desc: 'אירוע', amount: [100, 300] },
    { desc: 'בילוי', amount: [80, 200] }
  ],
  'חשבונות': [
    { desc: 'חשמל', amount: [200, 500] },
    { desc: 'מים', amount: [80, 200] },
    { desc: 'אינטרנט', amount: [80, 150] },
    { desc: 'טלפון', amount: [50, 150] }
  ],
  'קניות': [
    { desc: 'בגדים', amount: [100, 500] },
    { desc: 'מוצרי בית', amount: [50, 300] },
    { desc: 'אלקטרוניקה', amount: [200, 2000] }
  ],
  'בריאות': [
    { desc: 'רופא', amount: [200, 500] },
    { desc: 'תרופות', amount: [50, 200] },
    { desc: 'בית מרקחת', amount: [30, 150] }
  ]
};

// פונקציה ליצירת מספר אקראי בטווח
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// פונקציה ליצירת תאריך אקראי בחודש מסוים
function randomDateInMonth(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = randomBetween(1, daysInMonth);
  const date = new Date(year, month, day);
  return date.toISOString().split('T')[0];
}

// פונקציה ליצירת נתוני דמה
async function seedDummyData(userId, months = 3) {
  try {
    console.log(`🌱 מתחיל להוסיף נתוני דמה למשתמש: ${userId}`);
    console.log(`📅 מספר חודשים: ${months}`);

    const transactions = [];
    const now = new Date();
    
    // יצירת תנועות לכל חודש
    for (let monthOffset = months - 1; monthOffset >= 0; monthOffset--) {
      const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const year = date.getFullYear();
      const month = date.getMonth();

      console.log(`\n📆 חודש: ${month + 1}/${year}`);

      // הכנסה חודשית (משכורת) - בתחילת החודש
      const salaryDate = randomDateInMonth(year, month);
      transactions.push({
        userId,
        type: 'income',
        description: 'משכורת חודשית',
        amount: randomBetween(10000, 15000),
        category: 'משכורת',
        date: salaryDate,
        isOutlier: false
      });
      console.log(`  ✅ הוספה: משכורת - ${salaryDate}`);

      // הוצאות מגוונות בכל חודש
      const numExpenses = randomBetween(15, 25); // 15-25 הוצאות בחודש
      
      for (let i = 0; i < numExpenses; i++) {
        // בחירת קטגוריה אקראית
        const categories = Object.keys(expenseCategories);
        const category = categories[randomBetween(0, categories.length - 1)];
        const items = expenseCategories[category];
        const item = items[randomBetween(0, items.length - 1)];
        
        const amount = randomBetween(item.amount[0], item.amount[1]);
        const expenseDate = randomDateInMonth(year, month);
        
        transactions.push({
          userId,
          type: 'expense',
          description: item.desc,
          amount,
          category,
          date: expenseDate,
          isOutlier: false
        });
      }
      
      console.log(`  ✅ הוספו ${numExpenses} הוצאות בקטגוריות שונות`);
    }

    // הוספת התנועות למסד הנתונים
    console.log(`\n💾 שומר ${transactions.length} תנועות במסד הנתונים...`);
    await Transaction.insertMany(transactions);
    
    console.log(`\n✅ הושלם בהצלחה!`);
    console.log(`📊 סה"כ תנועות שנוספו: ${transactions.length}`);
    
    // חישוב סטטיסטיקות
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    console.log(`\n📈 סטטיסטיקות:`);
    console.log(`   💰 סה"כ הכנסות: ₪${totalIncome.toLocaleString()}`);
    console.log(`   💸 סה"כ הוצאות: ₪${totalExpenses.toLocaleString()}`);
    console.log(`   💵 מאזן: ₪${(totalIncome - totalExpenses).toLocaleString()}`);
    console.log(`   📅 ממוצע הכנסה חודשית: ₪${Math.round(totalIncome / months).toLocaleString()}`);
    console.log(`   📅 ממוצע הוצאה חודשית: ₪${Math.round(totalExpenses / months).toLocaleString()}`);
    
    return transactions.length;
  } catch (error) {
    console.error('❌ שגיאה בהוספת נתוני דמה:', error.message);
    throw error;
  }
}

// הרצת הסקריפט
async function main() {
  // קבלת userId מהפרמטרים
  const userId = process.argv[2];
  const months = parseInt(process.argv[3]) || 3;

  if (!userId) {
    console.error('❌ שגיאה: יש לספק userId');
    console.log('📝 שימוש: node seed-dummy-data.js <userId> [מספר חודשים]');
    console.log('📝 דוגמה: node seed-dummy-data.js 507f1f77bcf86cd799439011 3');
    process.exit(1);
  }

  try {
    // חיבור ל-MongoDB
    console.log('🔌 מתחבר ל-MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ התחברות הצליחה!\n');

    // הוספת נתוני דמה
    await seedDummyData(userId, months);

    // סגירת החיבור
    await mongoose.connection.close();
    console.log('\n👋 החיבור נסגר. סיום!');
    process.exit(0);
  } catch (error) {
    console.error('❌ שגיאה:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// הרצה
main();



