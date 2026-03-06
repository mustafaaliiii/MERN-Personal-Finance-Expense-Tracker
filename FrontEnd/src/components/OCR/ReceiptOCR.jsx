import { useState } from "react";
import { runReceiptOCR } from "../../utils/ocr";

function normalizeMoney(raw) {
  if (!raw) return "";
  const cleaned = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  return cleaned;
}

/**
 * FIXED: this regex now correctly matches:
 * - 1200
 * - 1158.30
 * - 1,158.30
 * It will NOT cut 1200 into 120 anymore.
 */
function extractNumbers(lineOrText) {
  const s = String(lineOrText);

  // comma separated numbers: 1,234 or 1,234.56
  const commaMatches =
    s.match(/\b\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?\b/g) || [];

  // plain numbers: 1200 or 1200.50 (4+ digits also)
  const plainMatches = s.match(/\b\d+(?:\.\d{1,2})?\b/g) || [];

  const all = [...commaMatches, ...plainMatches];

  const nums = all
    .map(normalizeMoney)
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n > 0);

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
        "mart",
        "bakery",
        "restaurant",
        "burger",
        "pizza",
        "milk",
        "bread",
        "eggs",
        "tea",
        "juice",
        "food",
      ],
    },
    {
      cat: "Transport",
      keys: [
        "petrol",
        "diesel",
        "fuel",
        "uber",
        "careem",
        "bus",
        "metro",
        "ticket",
        "toll",
      ],
    },
    {
      cat: "Bills",
      keys: [
        "electric",
        "electricity",
        "gas",
        "water",
        "internet",
        "wifi",
        "bill",
        "ptcl",
      ],
    },
    {
      cat: "Shopping",
      keys: ["store", "mall", "invoice", "sale", "cloth", "shoes", "garments"],
    },
    { cat: "Health", keys: ["pharmacy", "medicine", "hospital", "clinic", "medical", "lab"] },
  ];

  for (const r of rules) {
    if (r.keys.some((k) => t.includes(k))) return r.cat;
  }
  return "Other";
}

function extractDate(text) {
  if (!text) return "";

  const m1 = text.match(/\b(\d{4}[-/]\d{2}[-/]\d{2})\b/);
  if (m1) return m1[1];

  const m2 = text.match(/\b(\d{2}[-/]\d{2}[-/]\d{4})\b/);
  if (m2) return m2[1];

  const m3 = text.match(/\b(\d{1,2}-[A-Za-z]{3}-\d{4})\b/);
  if (m3) return m3[1];

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

    setLoading(true);
    try {
      let text = "";
      if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
        text = await readTextFile(file);
      } else {
        text = await runReceiptOCR(file);
      }

      setRawText(text);

      const parsed = parseReceipt(text);
      onFill?.(parsed);
    } catch (err) {
      console.error("Receipt OCR failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="text-xs text-slate-600">Scan Receipt (OCR)</label>

      <div className="input-box mt-1">
        <input
          type="file"
          accept="image/*,.txt"
          className="w-full bg-transparent outline-none"
          onChange={handleFile}
        />
      </div>

      {loading ? <p className="text-xs text-slate-500 mt-1">Scanning receipt…</p> : null}

      {rawText ? (
        <div className="mt-3">
          <label className="text-xs text-slate-600">OCR Text (debug)</label>
          <div className="input-box mt-1">
            <textarea
              rows={5}
              className="w-full bg-transparent outline-none resize-none"
              value={rawText}
              readOnly
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
