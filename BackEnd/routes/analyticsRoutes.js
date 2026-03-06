const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getForecast } = require("../controllers/analyticsController");

const router = express.Router();
router.get("/forecast", protect, getForecast);
module.exports = router;
