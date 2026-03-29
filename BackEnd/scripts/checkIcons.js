const mongoose = require("mongoose");
const Income = require("../models/Income");
require("dotenv").config();

const checkIcons = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const incomes = await Income.find({}).select("source icon amount");
    
    console.log("All income records:");
    incomes.forEach((income, idx) => {
      console.log(`${idx + 1}. ${income.source}: icon="${income.icon}" (length: ${income.icon?.length || 0})`);
      if (income.icon) {
        console.log(`   Char codes: ${Array.from(income.icon).map(c => c.charCodeAt(0)).join(", ")}`);
      }
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkIcons();
