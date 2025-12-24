const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  date: String,
  category: String
});

module.exports = mongoose.model("Expense", expenseSchema);
