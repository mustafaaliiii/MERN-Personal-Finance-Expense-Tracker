const User = require('../models/User');
const Income = require('../models/Income');
const Expense = require('../models/Expense');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Not authorized to update user roles' });
  }

  const { role } = req.body;
  if (!['user', 'admin', 'superadmin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role provided' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Not authorized to delete users' });
  }

  try {
    const userId = req.params.id;

    const [deletedIncomes, deletedExpenses, deletedUser] = await Promise.all([
      Income.deleteMany({ userId }),
      Expense.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// Get all expenses (admin view)
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({}).populate('userId', 'fullName email');
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses', error: error.message });
  }
};

// Get all incomes (admin view)
exports.getAllIncomes = async (req, res) => {
  try {
    const incomes = await Income.find({}).populate('userId', 'fullName email');
    res.status(200).json(incomes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching incomes', error: error.message });
  }
};

// Get system stats
exports.getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalExpenses = await Expense.countDocuments();
    const totalIncomes = await Income.countDocuments();
    const totalExpenseAmount = await Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
    const totalIncomeAmount = await Income.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);

    res.status(200).json({
      totalUsers,
      totalExpenses,
      totalIncomes,
      totalExpenseAmount: totalExpenseAmount[0]?.total || 0,
      totalIncomeAmount: totalIncomeAmount[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching system stats', error: error.message });
  }
};