const XLSX = require("xlsx");
const Expense = require("../models/Expense");

// Expanded mapping of categories to icons
const categoryIcons = {
  food: "🍔",
  transport: "🚗",
  groceries: "🛒",
  entertainment: "🎮",
  healthcare: "💊",
  utilities: "💡",
  rent: "🏠",
  education: "📚",
  shopping: "🛍️",
  travel: "✈️",
  fuel: "⛽",
  medicine: "💊",
  power: "🔌",
  water: "🚰",
  gas: "🔥",
  internet: "🌐",
  phone: "📱",
  mobile: "📱",
  insurance: "🛡️",
  child: "🧒",
  daycare: "👶",
  electricity: "⚡",
  sanitation: "🚽",
  basic: "🧺",
  groceries: "🛒",
  dining: "🍽️",
  restaurant: "🍽️",
  cafe: "☕",
  coffee: "☕",
  subscription: "📺",
  streaming: "📺",
  vacation: "🏖️",
  hotel: "🏨",
  flight: "✈️",
  investment: "💸",
  crypto: "🪙",
  gym: "🏋️",
  fitness: "🏃",
  hobby: "🎨",
  sports: "⚽",
  luxury: "💎",
  electronics: "💻",
  gifts: "🎁",
  decor: "🖼️",
  events: "🎫",
  concerts: "🎵",
  alcohol: "🍺",
  bars: "🍸",
  others: "❓",
};

// Add Expense
exports.addExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    const { icon, category, amount, date } = req.body;

    // Validate required fields
    if (!category || typeof category !== "string" || category.trim() === "") {
      return res.status(400).json({ message: "Category is required and must be a valid string." });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Amount is required and must be a positive number." });
    }

    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({ message: "Date is required and must be a valid date." });
    }

    // Assign icon based on normalized category
    const normalizedCategory = category.trim().toLowerCase();
    let assignedIcon = categoryIcons[normalizedCategory];
    // Fallback: try partial match if exact not found
    if (!assignedIcon) {
      assignedIcon = Object.keys(categoryIcons).find(key => normalizedCategory.includes(key)) ? categoryIcons[Object.keys(categoryIcons).find(key => normalizedCategory.includes(key))] : categoryIcons["others"];
    }

    const newExpense = new Expense({
      userId,
      icon: assignedIcon, // Assign the icon
      category: category.trim(), // Normalize category
      amount: parseFloat(amount), // Ensure amount is a number
      date: new Date(date),
    });

    await newExpense.save();
    res.status(200).json(newExpense);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding expense", error: error.message });
  }
};

// Get All Expense
exports.getAllExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    const expense = await Expense.find({ userId }).sort({ date: -1 });
    res.status(200).json(expense);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching expense", error: error.message });
  }
};

// Delete All Expenses
exports.deleteAllExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    await Expense.deleteMany({ userId });
    res.status(200).json({ message: "All expenses deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting all expenses", error: error.message });
  }
};

// Delete Expense With ID
exports.deleteExpenseWithID = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting expense", error: error.message });
  }
};

// Download Expense as Excel
exports.downloadExpenseExcel = async (req, res) => {
  const userId = req.user.id;
  try {
    const expense = await Expense.find({ userId }).sort({ date: -1 });

    const data = expense.map((item) => ({
      Category: item.category,
      Amount: item.amount,
      Date: item.date.toISOString().split("T")[0],
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Expense");
    XLSX.writeFile(wb, "expense_details.xlsx");
    res.download("expense_details.xlsx");
  } catch (error) {
    res.status(500).json({
      message: "Error downloading expense Excel",
      error: error.message,
    });
  }
};

// New function for parsing CSV/Excel and guessing categories
exports.parseCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    let rawData = [];

    const isPDF = req.file.mimetype === "application/pdf" || req.file.originalname.toLowerCase().endsWith(".pdf");

    if (isPDF) {
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(req.file.buffer);
      
      // Pre-process: Destroy PDF page headers/footers to prevent them from injecting into rawBuffers
      let cleanText = pdfData.text.replace(/Statement Of Account[\s\S]*?DebitCreditBalance/gi, "\n");
      const lines = cleanText.split("\n");
      
      let currentTx = null;
      // Many banks put the date alone on one line, then descriptions below it.
      const exactDateRegex = /^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}$/;

      for (let line of lines) {
          line = line.trim();
          if (!line) continue;

          // If the line is exactly a date (e.g. "02-01-2026") or starts with one, treat it as a new transaction block
          if (exactDateRegex.test(line) || /^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}\b/.test(line)) {
              if (currentTx && currentTx.rawBuffer.length > 5) {
                  rawData.push(currentTx);
              }
              const dateMatch = line.match(/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}/)[0];
              currentTx = { 
                  date: dateMatch, 
                  description: "", 
                  amount: 0, 
                  rawBuffer: line.replace(dateMatch, "").trim() 
              };
          } else if (currentTx) {
              currentTx.rawBuffer += " " + line;
          }
      }
      if (currentTx && currentTx.rawBuffer.length > 5) {
          rawData.push(currentTx);
      }

      // Process the accumulated blocks mathematically using Balance Differentials!
      let previousBalance = 0;
      const obMatch = pdfData.text.match(/(?:Opening Balance|Balance B\/F)\s*([0-9,]+(?:\.\d{2})?)/i);
      if (obMatch) {
          previousBalance = parseFloat(obMatch[1].replace(/,/g, ''));
      }

      for (let tx of rawData) {
          // AMPUTATION PROTOCOL: If a page break was absorbed into this transaction's buffer,
          // delete it and everything after it so the string terminates with the balance numbers.
          tx.rawBuffer = tx.rawBuffer.replace(/Statement Of Account[\s\S]*$/i, "").trim();

          // Clean the description
          let rawDesc = tx.rawBuffer.replace(/[^a-zA-Z0-9\s+\-]/g, " ").replace(/\s+/g, " ").trim();
          tx.description = rawDesc.substring(0, 80); // Longer descriptive context

          // ALGORITHMIC SOLVER: pdf-parse merges Account, Amount, and Balance together (e.g., 01011009237395 500000.00 932115.17 -> 01011009237395500000.00932115.17)
          // Normal Regex is too greedy. We must backwards-scan all permutations of A (amount) and B (balance) to find the mathematical match!
          let numStrMatch = tx.rawBuffer.match(/([0-9\.]+)$/);
          let foundMath = false;

          if (numStrMatch && previousBalance > 0) {
              let s = numStrMatch[1];
              for (let b_len = 1; b_len <= s.length - 1; b_len++) {
                  let B_str = s.substring(s.length - b_len);
                  if (!/^\d+(?:\.\d{1,2})?$/.test(B_str)) continue;
                  let B = parseFloat(B_str);
                  
                  for (let a_len = 1; a_len <= s.length - b_len; a_len++) {
                      let A_str = s.substring(s.length - b_len - a_len, s.length - b_len);
                      let A = parseFloat(A_str);
                      if (isNaN(A)) continue;
                      
                      if (Math.abs(B - (previousBalance - A)) < 0.01 || Math.abs(B - (previousBalance + A)) < 0.01) {
                          tx.amount = A;
                          previousBalance = B;
                          foundMath = true;
                          break;
                      }
                  }
                  if (foundMath) break;
              }
          }
          
          if (!foundMath) {
              // Safe fallback: grab any solid number for amount
              let genericNum = tx.rawBuffer.match(/(?:rs\.?|pkr)?\s*(\d{1,5}(?:,\d{3})*(?:\.\d{2})?)/i);
              tx.amount = genericNum ? parseFloat(genericNum[1].replace(/,/g, '')) : 0;
              
              // Crucial Anti-Domino Fix: Ensure previousBalance is forcibly synced to the ending balance even if math fails
              let emergencyBalanceMatch = tx.rawBuffer.match(/(\d+(?:\.\d{1,2})?)$/);
              if (emergencyBalanceMatch) {
                  previousBalance = parseFloat(emergencyBalanceMatch[1]);
              }
          }
      }
      
    } else {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rawData = XLSX.utils.sheet_to_json(sheet, { raw: false });
      console.log("RAW PARSED CSV:", rawData.slice(0, 2));
    }

    const parsedData = [];

    const findValue = (row, keywords) => {
      const key = Object.keys(row).find(k => keywords.some(kw => k.toLowerCase().includes(kw)));
      return key ? row[key] : null;
    };

    rawData.forEach((row, index) => {
      let dateRaw = findValue(row, ["date", "time", "posting"]);
      let descRaw = findValue(row, ["description", "details", "name", "payee", "memo", "title"]);
      let amountRaw = findValue(row, ["amount", "debit", "withdrawal", "spend", "value", "total"]);

      if (!descRaw || !amountRaw) {
         console.log("DROPPED ROW (missing desc/amt):", row);
         return;
      }

      let amount = parseFloat(amountRaw.toString().replace(/[^0-9.-]+/g,""));
      amount = Math.abs(amount);
      if (isNaN(amount) || amount === 0) return;

      let date = dateRaw ? new Date(dateRaw) : new Date();
      if (isNaN(date.getTime())) date = new Date();

      let categoryRaw = findValue(row, ["category", "type", "group"]);
      let finalCategory = "Other";

      if (categoryRaw && categoryRaw.toString().trim() !== "") {
        finalCategory = categoryRaw.toString().trim();
      } else {
        const descLower = descRaw.toString().toLowerCase();

        const rules = [
          { cat: "Food", keys: ["mart", "grocery", "supermarket", "bakery", "restaurant", "cafe", "coffee", "mcdonalds", "mcdonald", "kfc", "pizza", "food", "doordash"] },
          { cat: "Transport", keys: ["uber", "lyft", "taxi", "careem", "petrol", "fuel", "gas", "shell", "chevron", "transit"] },
          { cat: "Bills", keys: ["electric", "water", "internet", "wifi", "phone", "mobile", "utility", "nayapay", "easypaisa", "jazzcash", "pharmacy", "sk pharmacy"] },
          { cat: "Shopping", keys: ["amazon", "walmart", "target", "mall", "store", "clothing", "apparel"] },
          { cat: "Entertainment", keys: ["netflix", "spotify", "cinema", "movie", "steam", "playstation"] }
        ];

        for (const rule of rules) {
          if (rule.keys.some(k => descLower.includes(k))) {
            finalCategory = rule.cat;
            break;
          }
        }
      }

      parsedData.push({
        id: "temp_" + index + Date.now().toString(),
        date: date.toISOString().split("T")[0],
        description: descRaw.toString().trim(),
        amount: amount,
        category: finalCategory
      });
    });

    res.status(200).json(parsedData);
  } catch (error) {
    console.error("Parse Error details:", error);
    res.status(500).json({ message: "Error parsing file: " + error.message, error: error.message });
  }
};

// Bulk add expenses
exports.bulkAddExpenses = async (req, res) => {
  const userId = req.user.id;
  try {
    const { expenses } = req.body;
    
    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ message: "No valid expenses provided" });
    }

    const expensesToInsert = expenses.map(exp => {
      const normalizedCat = exp.category.trim().toLowerCase();
      let icon = categoryIcons[normalizedCat] || categoryIcons["others"];
      
      return {
        userId,
        icon: icon,
        category: exp.category,
        amount: parseFloat(exp.amount),
        date: new Date(exp.date)
      };
    });
    
    await Expense.insertMany(expensesToInsert);
    res.status(200).json({ message: `${expenses.length} expenses saved successfully!` });
  } catch (error) {
    res.status(500).json({ message: "Error adding bulk expenses", error: error.message });
  }
};
