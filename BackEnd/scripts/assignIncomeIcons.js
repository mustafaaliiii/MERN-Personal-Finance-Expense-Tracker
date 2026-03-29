const mongoose = require("mongoose");
const Income = require("../models/Income");
require("dotenv").config();

// Map income sources to emojis
const sourceIcons = {
  salary: "💼",
  freelance: "💻",
  bonus: "🎁",
  investment: "📈",
  rental: "🏠",
  dividend: "💰",
  interest: "🏦",
  commission: "💳",
  gift: "🎁",
  business: "🏢",
  side_hustle: "🚀",
  consulting: "👨‍💼",
  part_time: "⏰",
  overtime: "⌛",
  royalty: "✍️",
  wage: "💵",
  stipend: "📚",
  scholarship: "🎓",
  pension: "👴",
  severance: "📄",
};

const getIconForSource = (source) => {
  const normalized = source.toLowerCase().trim();
  
  if (sourceIcons[normalized]) {
    return sourceIcons[normalized];
  }
  
  for (const [key, icon] of Object.entries(sourceIcons)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return icon;
    }
  }
  
  return "💵";
};

const assignIconsToIncome = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const incomes = await Income.find({});
    console.log(`Found ${incomes.length} income records`);

    let updated = 0;
    for (const income of incomes) {
      const assignedIcon = getIconForSource(income.source);
      
      if (income.icon !== assignedIcon) {
        income.icon = assignedIcon;
        await income.save();
        updated++;
        console.log(`✓ ${income.source} → ${assignedIcon}`);
      }
    }

    console.log(`\nUpdated ${updated} records with proper emoji icons`);
    
    await mongoose.connection.close();
    console.log("Done!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

assignIconsToIncome();
