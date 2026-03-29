import { useState } from "react";
import { runEnhancedReceiptOCR } from "../../utils/ocr";

function normalizeMoney(raw) {
  if (!raw) return "";
  // Handle more variations of currency formatting
  const cleaned = raw
    .replace(/,/g, "") // Remove commas
    .replace(/[^\d.]/g, "") // Keep only numbers and dots (e.g. 100.00)
    .replace(/^[^0-9]+/, "") // Remove leading non-numbers
    .replace(/[^0-9]+$/, ""); // Remove trailing non-numbers
  return cleaned;
}

/**
 * Enhanced number extraction for receipts and handwritten text
 * Handles various formats and OCR errors
 */
function extractNumbers(lineOrText) {
  const s = String(lineOrText);

  // More comprehensive number patterns for receipts
  const patterns = [
    // Standard decimal: 123.45, 123.4
    /\b\d+(?:\.\d{1,2})?\b/g,
    // Comma separated: 1,234.56, 1,234
    /\b\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?\b/g,
    // Currency prefixed: $123.45, Rs 123.45, PKR 123.45
    /(?:[₹$£€¥]|Rs\.?|PKR|USD)\s*\d+(?:,\d{3})*(?:\.\d{1,2})?/gi,
    // Currency suffixed: 123.45 PKR, 123.45$
    /\b\d+(?:,\d{3})*(?:\.\d{1,2})?\s*(?:[₹$£€¥]|Rs\.?|PKR|USD)\b/gi,
    // Handwritten style: 123-45 (misread decimal)
    /\b\d+[-]\d{1,2}\b/g,
  ];

  const all = [];
  patterns.forEach(pattern => {
    const matches = s.match(pattern) || [];
    all.push(...matches);
  });

  const nums = all
    .map(normalizeMoney)
    .map((x) => {
      // Handle handwritten decimal errors (123-45 -> 123.45)
      const fixed = x.replace(/-(\d{1,2})$/, '.$1');
      return Number(fixed);
    })
    .filter((n) => Number.isFinite(n) && n > 0 && n < 1000000); // Reasonable bounds for expenses

  return nums;
}

function extractTotalAmount(text) {
  if (!text) return "";

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const isGoodTotalLine = (line) => {
    const u = line.toUpperCase();
    const hasTotalKeyword =
      /\b(GRAND\s*TOTAL|TOTAL|NET\s*AMOUNT|AMOUNT\s*DUE|PAYABLE)\b/.test(u);

    const isBad =
      /\b(SUBTOTAL|TAX|GST|VAT|DISCOUNT|CHANGE|SERVICE)\b/.test(u) || /%/.test(u);

    return hasTotalKeyword && !isBad;
  };

  // 1) bottom-up: best TOTAL line(s)
  let candidates = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (!isGoodTotalLine(line)) continue;
    candidates = candidates.concat(extractNumbers(line));
  }

  if (candidates.length) {
    return String(Math.max(...candidates));
  }

  // 2) fallback: any TOTAL line (ignore %)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (!/\bTOTAL\b/i.test(line) || /%/.test(line)) continue;
    const nums = extractNumbers(line);
    if (nums.length) return String(Math.max(...nums));
  }

  // 3) final fallback: largest number in whole receipt
  const allNums = extractNumbers(text);
  return allNums.length ? String(Math.max(...allNums)) : "";
}

function extractCategory(text) {
  if (!text) return "Other";
  const t = text.toLowerCase();

  const rules = [
    {
      cat: "Food",
      keys: [
        "mart", "grocery", "supermarket", "store",
        "bakery", "restaurant", "cafe", "hotel", "lounge",
        "burger", "pizza", "sandwich", "pasta", "noodles",
        "milk", "bread", "eggs", "butter", "cheese", "yogurt",
        "tea", "coffee", "juice", "soda", "water", "beverage",
        "food", "dining", "meal", "snack", "candy", "chocolate",
        "fruit", "vegetable", "meat", "chicken", "fish",
        "kfc", "mcdonald", "subway", "domino", "pizza hut"
      ],
    },
    {
      cat: "Transport",
      keys: [
        "petrol", "diesel", "fuel", "gas", "gasoline",
        "uber", "careem", "ola", "lyft", "taxi", "cab",
        "bus", "metro", "train", "railway", "tram",
        "ticket", "toll", "parking", "auto", "rickshaw",
        "shell", "total", "bp", "esso", "mobil", "chevron"
      ],
    },
    {
      cat: "Bills",
      keys: [
        "electric", "electricity", "power", "kesc", "lesco",
        "gas", "sui", "natural gas",
        "water", "wasa", "sewerage",
        "internet", "wifi", "broadband", "ptcl", "jazz", "telenor",
        "bill", "invoice", "payment", "utility",
        "phone", "mobile", "cell", "telephone", "landline"
      ],
    },
    {
      cat: "Shopping",
      keys: [
        "store", "mall", "market", "bazaar", "shop",
        "invoice", "sale", "purchase", "receipt",
        "cloth", "clothes", "clothing", "shirt", "pant", "trouser",
        "shoes", "sneakers", "boots", "sandals",
        "garments", "fashion", "outfit", "wear",
        "electronics", "mobile", "phone", "laptop", "computer",
        "jewelry", "watch", "cosmetics", "perfume"
      ],
    },
    {
      cat: "Health",
      keys: [
        "pharmacy", "chemist", "drugstore", "medical",
        "medicine", "tablet", "capsule", "syrup", "injection",
        "hospital", "clinic", "doctor", "physician", "dentist",
        "lab", "laboratory", "diagnostic", "test", "scan",
        "pharma", "wellness", "fitness", "gym", "spa"
      ],
    },
    {
      cat: "Entertainment",
      keys: [
        "movie", "cinema", "theater", "film",
        "game", "gaming", "playstation", "xbox", "nintendo",
        "music", "concert", "show", "event",
        "book", "magazine", "newspaper",
        "park", "amusement", "zoo", "museum"
      ],
    },
    {
      cat: "Education",
      keys: [
        "school", "college", "university", "academy",
        "book", "stationery", "copy", "notebook",
        "course", "class", "tuition", "fee", "exam"
      ],
    }
  ];

  // Score each category based on keyword matches
  const scores = rules.map(rule => ({
    cat: rule.cat,
    score: rule.keys.reduce((score, key) => {
      // Count occurrences of each keyword
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = t.match(regex);
      return score + (matches ? matches.length : 0);
    }, 0)
  }));

  // Return category with highest score, or "Other" if no matches
  const bestMatch = scores.reduce((best, current) =>
    current.score > best.score ? current : best,
    { cat: "Other", score: 0 }
  );

  return bestMatch.cat;
}

function extractDate(text) {
  if (!text) return "";

  // More comprehensive date patterns for receipts
  const patterns = [
    // YYYY-MM-DD or YYYY/MM/DD
    /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/,
    // DD-MM-YYYY or DD/MM/YYYY
    /\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/,
    // DD-MMM-YYYY (e.g., 15-Mar-2024)
    /\b(\d{1,2}-[A-Za-z]{3}-\d{4})\b/,
    // MMM DD, YYYY (e.g., Mar 15, 2024)
    /\b([A-Za-z]{3}\s+\d{1,2},?\s+\d{4})\b/,
    // DD MMM YYYY (e.g., 15 Mar 2024)
    /\b(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\b/,
    // MM/DD/YYYY (US format)
    /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/,
    // DD.MM.YYYY (European format)
    /\b(\d{1,2}\.\d{1,2}\.\d{4})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let dateStr = match[1];

      // Normalize different formats to YYYY-MM-DD
      try {
        // Handle various input formats
        let date;

        if (dateStr.includes('/')) {
          // Handle MM/DD/YYYY vs DD/MM/YYYY ambiguity
          const parts = dateStr.split('/');
          if (parts[0].length === 4) {
            // YYYY/MM/DD
            date = new Date(dateStr);
          } else if (parseInt(parts[0]) > 12) {
            // DD/MM/YYYY
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else {
            // Assume MM/DD/YYYY for US receipts
            date = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
          }
        } else if (dateStr.includes('-')) {
          // Handle YYYY-MM-DD or DD-MM-YYYY
          const parts = dateStr.split('-');
          if (parts[0].length === 4) {
            date = new Date(dateStr);
          } else {
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        } else if (dateStr.includes(' ')) {
          // Handle "MMM DD, YYYY" or "DD MMM YYYY"
          date = new Date(dateStr);
        } else if (dateStr.includes('.')) {
          // Handle DD.MM.YYYY
          const parts = dateStr.split('.');
          date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }

        if (date && !isNaN(date.getTime())) {
          // Validate reasonable date range (last 2 years to next year)
          const now = new Date();
          const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
          const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

          if (date >= twoYearsAgo && date <= nextYear) {
            return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
          }
        }
      } catch {
        // Continue to next pattern if parsing fails
        continue;
      }
    }
  }

  return "";
}

function parseReceipt(text) {
  return {
    category: extractCategory(text),
    amount: extractTotalAmount(text),
    date: extractDate(text),
    icon: "",
  };
}

export default function ReceiptOCR({ onFill }) {
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const readTextFile = (file) =>
    new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = reject;
      fr.readAsText(file);
    });

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'text/plain'];
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.txt')) {
      alert('Please select a valid image file (JPEG, PNG, WebP) or text file.');
      return;
    }

    setLoading(true);
    setProgress(0);
    setStatus("Preprocessing image...");
    setRawText("");

    try {
      let text = "";
      if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
        setStatus("Reading text file...");
        text = await readTextFile(file);
        setProgress(50);
      } else {
        // Use enhanced OCR for better receipt and handwriting recognition
        setStatus("Preprocessing image for better OCR...");
        setProgress(20);

        // Simulate progress updates (Tesseract doesn't provide progress)
        setTimeout(() => setProgress(40), 500);
        setStatus("Running OCR (this may take a moment)...");

        text = await runEnhancedReceiptOCR(file);
        setProgress(80);
      }

      setRawText(text);
      setStatus("Processing extracted text...");

      if (!text.trim()) {
        setStatus("No text found - try a clearer image");
        alert('No text could be extracted from the image. Please try:\n• A clearer, well-lit photo\n• Different angle\n• Remove glare or shadows\n• Ensure text is readable');
        setProgress(0);
        return;
      }

      const parsed = parseReceipt(text);
      setProgress(100);
      setStatus(`Extracted: ${parsed.category} - ${parsed.amount || 'No amount'} - ${parsed.date || 'No date'}`);

      onFill?.(parsed);

      // Auto-clear status after success
      setTimeout(() => {
        setStatus("");
        setProgress(0);
      }, 3000);

    } catch (err) {
      console.error("Receipt OCR failed:", err);
      setStatus("OCR failed - please try again");
      alert('OCR processing failed. Please try again with a different image or check your internet connection.');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="text-xs text-slate-600">Scan Receipt (OCR)</label>
      <p className="text-xs text-slate-500 mb-2">
        Upload receipt photos or handwritten notes. Supports JPEG, PNG, WebP images.
      </p>

      <div className="input-box mt-1">
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,.txt"
          className="w-full bg-transparent outline-none"
          onChange={handleFile}
          disabled={loading}
        />
      </div>

      {loading && (
        <div className="mt-2">
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-1">{status}</p>
        </div>
      )}

      {!loading && status && (
        <p className={`text-xs mt-1 ${status.includes('failed') ? 'text-red-500' : 'text-green-600'}`}>
          {status}
        </p>
      )}

      {rawText && !loading && (
        <div className="mt-3">
          <label className="text-xs text-slate-600">Extracted Text</label>
          <div className="input-box mt-1">
            <textarea
              rows={4}
              className="w-full bg-transparent outline-none resize-none text-xs"
              value={rawText}
              readOnly
              placeholder="OCR extracted text will appear here..."
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            This text was extracted from your image. The system automatically detects amount, category, and date.
          </p>
        </div>
      )}
    </div>
  );
}
