// src/components/Expense/AddExpenseForm.jsx
import { useEffect, useState } from "react";
import Input from "../Inputs/Input";
import EmojiPickerPopup from "../EmojiPickerPopup";
import ReceiptOCR from "../OCR/ReceiptOCR";

const AddExpenseForm = (props) => {
  const { onAddExpense, initialExpense } = props;

  const [expense, setExpense] = useState({
    category: "",
    amount: "",
    date: "",
    icon: "",
    ...(initialExpense || {}),
  });

  useEffect(() => {
    if (!initialExpense) return;
    setExpense((prev) => ({
      ...prev,
      category: prev.category || initialExpense.category || "",
      amount: prev.amount || initialExpense.amount || "",
      date: prev.date || initialExpense.date || "",
      icon: prev.icon || initialExpense.icon || "",
    }));
  }, [initialExpense]);

  const handleChange = (key, value) => setExpense({ ...expense, [key]: value });

  return (
    <div>
      {/* ✅ OCR optional: auto-fill amount + category (+date)
          IMPORTANT: keep amount as STRING (no Number()) so it won't truncate like 1198.30 -> 119
      */}
      <ReceiptOCR
        onFill={(parsed) => {
          if (parsed?.amount) {
            // keep EXACT OCR string (e.g., "1198.30")
            setExpense((p) => ({ ...p, amount: String(parsed.amount) }));
          }

          if (parsed?.category) {
            setExpense((p) => ({ ...p, category: parsed.category }));
          }

          if (parsed?.date) {
            setExpense((p) => ({ ...p, date: parsed.date }));
          }
        }}
      />

      <EmojiPickerPopup
        icon={expense.icon}
        onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
      />

      <Input
        value={expense.category}
        onChange={(e) => handleChange("category", e.target.value)}
        label="Expense Category"
        placeholder="Food, Transport, etc."
        type="text"
      />

      {/* ✅ Amount must be TEXT to preserve decimals and prevent truncation */}
      <Input
        value={expense.amount}
        onChange={(e) => handleChange("amount", e.target.value)}
        label="Amount"
        placeholder="Enter amount"
        type="text"
      />

      <Input
        value={expense.date}
        onChange={(e) => handleChange("date", e.target.value)}
        label="Date"
        placeholder="YYYY-MM-DD"
        type="date"
      />

      <div className="flex justify-end mt-6">
        <button
          type="button"
          className="add-btn primary-btn-fill"
          onClick={() => {
            onAddExpense(expense);
            setExpense({ category: "", amount: "", date: "", icon: "" });
          }}
        >
          Add Expense
        </button>
      </div>
    </div>
  );
};

export default AddExpenseForm;
