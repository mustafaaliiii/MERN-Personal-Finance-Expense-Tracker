const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);
app.use(express.json());

// DB
connectDB();

// Routes
app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/income", require("./routes/incomeRoutes"));
app.use("/api/v1/expense", require("./routes/expenseRoutes"));
app.use("/api/v1/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/v1/analytics", require("./routes/analyticsRoutes"));
app.use("/api/v1/admin", require("./routes/adminRoutes"));

// ✅ NEW: AI Prediction Routes (Node → Python FastAPI)
app.use("/api/v1/predict", require("./routes/predictionRoutes"));

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health / root
app.get("/", (_, res) => res.send("API running"));

// TEMPORARY: Make user admin (for development)
app.post("/api/v1/admin/make-admin", async (req, res) => {
  const { email } = req.body;
  try {
    const User = require("./models/User");
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.role = "admin";
    await user.save();
    res.status(200).json({ message: "User promoted to admin" });
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
