const mongoose = require("mongoose");
const Expense = require("../models/Expense");
require("dotenv").config();

const checkExpenseIcons = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const expenses = await Expense.find({}).select("category icon amount");
    
    console.log("All expense records:");
    expenses.forEach((expense, idx) => {
      console.log(`${idx + 1}. ${expense.category}: icon="${expense.icon}" (length: ${expense.icon?.length || 0})`);
      if (expense.icon) {
        console.log(`   Char codes: ${Array.from(expense.icon).map(c => c.charCodeAt(0)).join(", ")}`);
      }
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkExpenseIcons();
