const express = require("express");
const router = express.Router();

const {
  getForecast,
  getRecommendations,
} = require("../controllers/predictionController");

router.post("/forecast", getForecast);
router.post("/recommend", getRecommendations);

module.exports = router;
