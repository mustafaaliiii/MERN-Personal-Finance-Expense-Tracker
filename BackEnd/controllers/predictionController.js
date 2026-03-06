const axios = require("axios");

// Forecast expenses
const getForecast = async (req, res) => {
  try {
    const { steps = 3 } = req.body;

    const response = await axios.post("http://localhost:5001/forecast", { steps });

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
