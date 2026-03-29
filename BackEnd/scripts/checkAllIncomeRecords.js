const mongoose = require("mongoose");
const Income = require("../models/Income");
require("dotenv").config();

const checkAllIcons = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Get all records without user filter
    const allRecords = await Income.find({}).select("source icon amount userId");
    
    console.log(`Total records: ${allRecords.length}`);
    console.log("\nAll income records (including all users):");
    allRecords.forEach((income, idx) => {
      console.log(`${idx + 1}. ${income.source}: icon="${income.icon}" userId=${income.userId}`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkAllIcons();
