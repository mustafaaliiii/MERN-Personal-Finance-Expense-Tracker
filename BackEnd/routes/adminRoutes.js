const express = require('express');
const router = express.Router();
const { protectAdmin, protectSuperAdmin } = require('../middleware/adminMiddleware');
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getAllExpenses,
  getAllIncomes,
  getSystemStats,
} = require('../controllers/adminController');

// Admin and superadmin can access read-only admin data
router.use(protectAdmin);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);

// Superadmin-only actions
router.put('/users/:id/role', protectSuperAdmin, updateUserRole);
router.delete('/users/:id', protectSuperAdmin, deleteUser);

// System data
router.get('/expenses', getAllExpenses);
router.get('/incomes', getAllIncomes);
router.get('/stats', getSystemStats);

module.exports = router;