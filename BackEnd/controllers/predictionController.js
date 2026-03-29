const axios = require("axios");

// Forecast expenses
const getForecast = async (req, res) => {
  try {
    const { steps = 3, userId, monthly_income, monthly_expense } = req.body;

    // Get user's expense history for personalization
    const Expense = require('../models/Expense');
    const userExpenses = await Expense.find({ userId: userId })
      .sort({ date: -1 })
      .limit(12); // Last 12 months

    // Aggregate monthly totals
    const monthlyTotals = {};
    userExpenses.forEach(expense => {
      const monthKey = expense.date.toISOString().slice(0, 7); // YYYY-MM
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + expense.amount;
    });

    const history = Object.values(monthlyTotals).reverse(); // Chronological order

    const response = await axios.post("http://localhost:5001/forecast", {
      steps,
      history: history.length > 0 ? history : null,
      monthly_income: monthly_income || null,
      monthly_expense: monthly_expense || null
    });

    return res.json(response.data);
  } catch (error) {
    console.error("Forecast error:", error.message);
    return res.status(500).json({ message: "Forecast failed", error: error.message });
  }
};

// Recommendations
const getRecommendations = async (req, res) => {
  try {
    const { monthly_income, monthly_budget, category_spend_last30 } = req.body;

    const response = await axios.post("http://localhost:5001/recommend", {
      monthly_income,
      monthly_budget,
      category_spend_last30,
    });

    return res.json(response.data);
  } catch (error) {
    console.error("Recommend error:", error.message);
    return res
      .status(500)
      .json({ message: "Recommendation failed", error: error.message });
  }
};

module.exports = { getForecast, getRecommendations };
