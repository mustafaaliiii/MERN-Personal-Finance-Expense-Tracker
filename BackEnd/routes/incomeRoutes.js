const express = require("express");
const {
  addIncome,
  getAllIncome,
  deleteAllIncome,
  deleteIncomeWithID,
  downloadIncomeExcel,
  cleanupCorruptedIcons,
  parseCsv,
  bulkAddIncomes
} = require("../controllers/incomeController");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post("/add", protect, addIncome);
router.get("/get", protect, getAllIncome);
router.get("/downloadexcel", protect, downloadIncomeExcel);
router.post("/cleanup-icons", protect, cleanupCorruptedIcons);
router.delete("/all", protect, deleteAllIncome);
router.delete("/:id", protect, deleteIncomeWithID);
router.post("/parse-csv", protect, upload.single("file"), parseCsv);
router.post("/bulk", protect, bulkAddIncomes);

module.exports = router;
