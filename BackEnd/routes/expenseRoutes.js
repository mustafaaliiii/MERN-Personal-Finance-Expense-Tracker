const express = require("express");
const {
  addExpense,
  getAllExpense,
  deleteAllExpenses,
  deleteExpenseWithID,
  downloadExpenseExcel,
  parseCsv,
  bulkAddExpenses
} = require("../controllers/expenseController");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post("/add", protect, addExpense);
router.get("/get", protect, getAllExpense);
router.get("/downloadexcel", protect, downloadExpenseExcel);
router.delete("/all", protect, deleteAllExpenses);
router.delete("/:id", protect, deleteExpenseWithID);
router.post("/parse-csv", protect, upload.single("file"), parseCsv);
router.post("/bulk", protect, bulkAddExpenses);

module.exports = router;
