const XLSX = require("xlsx");
const Income = require("../models/Income");

// Mapping of income sources to emoji icons
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

// Helper function to validate emoji/icon - reject mixed ASCII/symbol combinations
const isValidIcon = (icon) => {
  if (!icon || typeof icon !== "string") return false;
  // Check if it's a valid URL (data URL or http/https)
  if (icon.startsWith("http") || icon.startsWith("data:")) return true;
  
  // For non-URL icons:
  // REJECT if contains ANY ASCII letters or numbers (e.g., "↑q" is invalid)
  if (/[a-zA-Z0-9]/.test(icon)) return false;
  
  // MUST be 1-4 characters for emoji (some emojis are multi-char)
  if (icon.length > 4) return false;
  
  // Check if it's in valid emoji Unicode ranges (includes electricity ⚡)
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{1F000}-\u{1F02F}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{2764}]/u;
  return emojiRegex.test(icon);
};

// Function to assign icon based on income source
const getIconForSource = (source) => {
  const normalized = source.toLowerCase().trim();
  
  // Check exact match
  if (sourceIcons[normalized]) {
    return sourceIcons[normalized];
  }
  
  // Check partial match
  for (const [key, icon] of Object.entries(sourceIcons)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return icon;
    }
  }
  
  // Default icon for unknown sources
  return "💵";
};

// Add Income Source
exports.addIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    const { icon, source, amount, date } = req.body;

    if (!source || !amount || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Assign icon based on source or use provided icon if valid
    let assignedIcon = isValidIcon(icon) ? icon : getIconForSource(source);

    const newIncome = new Income({
      userId,
      icon: assignedIcon,
      source,
      amount,
      date: new Date(date),
    });

    await newIncome.save();
    res.status(200).json(newIncome);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding income", error: error.message });
  }
};

// Get All Income Sources
exports.getAllIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    let incomes = await Income.find({ userId }).sort({ date: -1 });
    
    // Assign proper emoji icons based on source - sanitize and assign
    incomes = incomes.map(income => {
      const sanitized = income.toObject();
      
      // If icon is invalid or corrupted, assign based on source
      if (!isValidIcon(sanitized.icon)) {
        sanitized.icon = getIconForSource(sanitized.source);
      }
      
      return sanitized;
    });
    
    res.status(200).json(incomes);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching income sources", error: error.message });
  }
};

// Delete All Income Sources
exports.deleteAllIncome = async (req, res) => {
  try {
    const userId = req.user.id;
    await Income.deleteMany({ userId });
    res
      .status(200)
      .json({ message: "All income sources deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting all income sources",
      error: error.message,
    });
  }
};

/// Delete Income Source by ID
exports.deleteIncomeWithID = async (req, res) => {
  try {
    await Income.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Income deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting income", error: error.message });
  }
};

// Download Income Sources as Excel
exports.downloadIncomeExcel = async (req, res) => {
  const userId = req.user.id;
  try {
    const income = await Income.find({ userId }).sort({ date: -1 });

    const data = income.map((item) => ({
      Source: item.source,
      Amount: item.amount,
      Date: item.date.toISOString().split("T")[0],
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Income");
    XLSX.writeFile(wb, "income_details.xlsx");
    res.download("income_details.xlsx");
  } catch (error) {
    res.status(500).json({
      message: "Error downloading income Excel",
      error: error.message,
    });
  }
};

// Cleanup corrupted icons (internal maintenance endpoint)
exports.cleanupCorruptedIcons = async (req, res) => {
  try {
    const result = await Income.updateMany(
      {},
      [
        {
          $set: {
            icon: {
              $cond: [
                {
                  $and: [
                    { $eq: [{ $type: "$icon" }, "string"] },
                    { $gt: [{ $strLenCP: "$icon" }, 0] },
                    // Check if icon contains ASCII letters/numbers
                    { $regexMatch: { input: "$icon", regex: "[a-zA-Z0-9]" } }
                  ]
                },
                "", // Set to empty string if corrupted
                "$icon" // Keep original if valid
              ]
            }
          }
        }
      ]
    );
    
    res.status(200).json({ 
      message: "Cleaned up corrupted icons",
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({
      message: "Error cleaning up icons",
      error: error.message,
    });
  }
};

// New function for parsing CSV/Excel for Incomes
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
      
      let cleanText = pdfData.text.replace(/Statement Of Account[\s\S]*?DebitCreditBalance/gi, "\n");
      const lines = cleanText.split("\n");
      
      let currentTx = null;
      const exactDateRegex = /^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}$/;

      for (let line of lines) {
          line = line.trim();
          if (!line) continue;

          if (exactDateRegex.test(line) || /^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}\b/.test(line)) {
              if (currentTx && currentTx.rawBuffer.length > 5) {
                  rawData.push(currentTx);
              }
              const dateMatch = line.match(/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}/)[0];
              currentTx = { 
                  date: dateMatch, 
                  source: "", 
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

      let previousBalance = 0;
      const obMatch = pdfData.text.match(/(?:Opening Balance|Balance B\/F)\s*([0-9,]+(?:\.\d{2})?)/i);
      if (obMatch) {
          previousBalance = parseFloat(obMatch[1].replace(/,/g, ''));
      }

      for (let tx of rawData) {
          tx.rawBuffer = tx.rawBuffer.replace(/Statement Of Account[\s\S]*$/i, "").trim();
          let rawDesc = tx.rawBuffer.replace(/[^a-zA-Z0-9\s+\-]/g, " ").replace(/\s+/g, " ").trim();
          tx.source = rawDesc.substring(0, 80);

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
              let genericNum = tx.rawBuffer.match(/(?:rs\.?|pkr)?\s*(\d{1,5}(?:,\d{3})*(?:\.\d{2})?)/i);
              tx.amount = genericNum ? parseFloat(genericNum[1].replace(/,/g, '')) : 0;
              
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
    }

    const parsedData = [];

    const findValue = (row, keywords) => {
      const key = Object.keys(row).find(k => keywords.some(kw => k.toLowerCase().includes(kw)));
      return key ? row[key] : null;
    };

    rawData.forEach((row, index) => {
      let dateRaw = findValue(row, ["date", "time", "posting"]);
      let sourceRaw = findValue(row, ["source", "description", "details", "name", "payee", "memo", "title", "employer", "company"]);
      let amountRaw = findValue(row, ["income", "amount", "credit", "deposit", "received", "value", "total", "salary"]);

      if (!sourceRaw || !amountRaw) return;

      let amount = parseFloat(amountRaw.toString().replace(/[^0-9.-]+/g,""));
      amount = Math.abs(amount);
      if (isNaN(amount) || amount === 0) return;

      let date = dateRaw ? new Date(dateRaw) : new Date();
      if (isNaN(date.getTime())) date = new Date();

      parsedData.push({
        id: "temp_" + index + Date.now().toString(),
        date: date.toISOString().split("T")[0],
        source: sourceRaw.toString().trim(),
        amount: amount
      });
    });

    res.status(200).json(parsedData);
  } catch (error) {
    console.error("Income Parse Error details:", error);
    res.status(500).json({ message: "Error parsing file: " + error.message, error: error.message });
  }
};

// Bulk add incomes
exports.bulkAddIncomes = async (req, res) => {
  const userId = req.user.id;
  try {
    const { incomes } = req.body;
    
    if (!Array.isArray(incomes) || incomes.length === 0) {
      return res.status(400).json({ message: "No valid incomes provided" });
    }

    const incomesToInsert = incomes.map(inc => {
      return {
        userId,
        icon: getIconForSource(inc.source),
        source: inc.source,
        amount: parseFloat(inc.amount),
        date: new Date(inc.date)
      };
    });
    
    await Income.insertMany(incomesToInsert);
    res.status(200).json({ message: `${incomes.length} incomes saved successfully!` });
  } catch (error) {
    res.status(500).json({ message: "Error adding bulk incomes", error: error.message });
  }
};
