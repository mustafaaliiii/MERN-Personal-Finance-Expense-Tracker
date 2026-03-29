const mongoose = require("mongoose");
const Income = require("../models/Income");
require("dotenv").config();

const cleanCorruptedIcons = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find all income records with corrupted icons
    const corrupted = await Income.find({
      $or: [
        { icon: /[a-zA-Z0-9]/ }, // Contains letters or numbers
        { icon: "↑q" }, // Specific corrupted symbol
        { icon: /↑/ }, // Any arrow symbol
      ]
    });

    console.log(`Found ${corrupted.length} corrupted records`);

    // Update all corrupted icons to empty string
    const result = await Income.updateMany(
      {
        $or: [
          { icon: /[a-zA-Z0-9]/ },
          { icon: "↑q" },
          { icon: /↑/ },
        ]
      },
      { $set: { icon: "" } }
    );

    console.log(`Updated ${result.modifiedCount} records`);

    // Verify
    const remaining = await Income.find({
      $or: [
        { icon: /[a-zA-Z0-9]/ },
        { icon: "↑q" },
        { icon: /↑/ },
      ]
    });

    console.log(`Remaining corrupted: ${remaining.length}`);
    
    await mongoose.connection.close();
    console.log("Done!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

cleanCorruptedIcons();
