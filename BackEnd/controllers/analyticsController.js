const Expense = require("../models/Expense");
const Income = require("../models/Income");
const User = require("../models/User");

// GET /api/v1/analytics/forecast?days=30
exports.getForecast = async (req, res) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 90);

    const since = new Date();
    since.setDate(since.getDate() - 60);

    const [expensesAgg, incomesAgg] = await Promise.all([
      Expense.aggregate([
        { $match: { userId: req.user._id, date: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, amount: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
      ]),
      Income.aggregate([
        { $match: { userId: req.user._id, date: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, amount: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const toSeries = (agg) => {
      const map = new Map(agg.map(d => [d._id, d.amount]));
      const out = [];
      const d = new Date();
      d.setDate(d.getDate() - 59);
      for (let i = 0; i < 60; i++) {
        const key = d.toISOString().slice(0, 10);
        out.push(map.get(key) || 0);
        d.setDate(d.getDate() + 1);
      }
      return out;
    };

    const expenseSeries = toSeries(expensesAgg);
    const incomeSeries  = toSeries(incomesAgg);
    const mean = (arr) => arr.reduce((a,b)=>a+b,0) / (arr.length || 1);
    const expenseAvg = mean(expenseSeries.slice(-30));
    const incomeAvg  = mean(incomeSeries.slice(-30));

    const mkFuture = (avg) =>
      Array.from({ length: days }, (_, i) => {
        return Number(avg.toFixed(2));
      });

    res.json({
      params: { days },
      expenseForecast: mkFuture(expenseAvg),
      incomeForecast: mkFuture(incomeAvg),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to compute forecast" });
  }
};
