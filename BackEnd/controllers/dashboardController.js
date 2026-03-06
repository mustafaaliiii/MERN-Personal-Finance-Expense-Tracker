const Expense = require("../models/Expense");
const Income = require("../models/Income");
const User = require("../models/User");

// GET /api/v1/dashboard
exports.getDashboardData = async (req, res) => {
  try {
    const [incomeAgg, expenseAgg, user] = await Promise.all([
      Income.aggregate([
        { $match: { userId: req.user._id } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([
        { $match: { userId: req.user._id } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      User.findById(req.user._id).lean(),
    ]);

    const totalIncome = incomeAgg[0]?.total || 0;
    const totalExpenses = expenseAgg[0]?.total || 0;
    const totalBalance = totalIncome - totalExpenses;

    const now = new Date();

    const since30 = new Date(now);
    since30.setDate(now.getDate() - 30);

    const since60 = new Date(now);
    since60.setDate(now.getDate() - 60);

    const [last30DaysExpenses, last60DaysIncome] = await Promise.all([
      Expense.aggregate([
        { $match: { userId: req.user._id, date: { $gte: since30 } } },
        { $sort: { date: -1 } },
      ]),
      Income.aggregate([
        { $match: { userId: req.user._id, date: { $gte: since60 } } },
        { $sort: { date: -1 } },
      ]),
    ]);

    // recent 5 transactions (merge income & expense with type flags)
    const recentIncome = await Income.find({ userId: req.user._id }).sort({ date: -1 }).limit(5).lean();
    const recentExpense = await Expense.find({ userId: req.user._id }).sort({ date: -1 }).limit(5).lean();
    const recentTransactions = [
      ...recentIncome.map(r => ({ ...r, type: "income" })),
      ...recentExpense.map(r => ({ ...r, type: "expense" })),
    ].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,5);

    let out = {
      totalIncome,
      totalExpenses,
      totalBalance,
      last30DaysExpenses: { transactions: last30DaysExpenses },
      last60DaysIncome: { transactions: last60DaysIncome },
      recentTransactions,
    };

    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load dashboard data" });
  }
};
