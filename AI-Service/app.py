from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import joblib
import json
from pathlib import Path
import numpy as np
from datetime import datetime

app = FastAPI(title="Finance AI Service")

# ✅ CORS (important for frontend integration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict later if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = Path("models/sarimax_expense.pkl")
META_PATH = Path("models/meta.json")

model = None
meta = {}

# -----------------------
# Request / Response Models
# -----------------------

class ForecastRequest(BaseModel):
    steps: int = Field(3, ge=1, le=24)
    history: Optional[List[float]] = None
    monthly_income: Optional[float] = None
    monthly_expense: Optional[float] = None


class ForecastResponse(BaseModel):
    steps: int
    forecast: List[float]
    meta: Dict


class RecommendRequest(BaseModel):
    monthly_income: float
    monthly_budget: float
    category_spend_last30: Dict[str, float]


class RecommendResponse(BaseModel):
    suggested_category_budgets: Dict[str, float]
    notes: List[str]


# -----------------------
# Load Model on Startup
# -----------------------

def load_model():
    global model, meta
    if MODEL_PATH.exists():
        model = joblib.load(MODEL_PATH)
    else:
        model = None

    if META_PATH.exists():
        meta = json.loads(META_PATH.read_text())
    else:
        meta = {}


@app.on_event("startup")
def startup():
    load_model()


@app.get("/health")
def health():
    return {
        "ok": True,
        "model_loaded": model is not None,
        "meta": meta
    }


# -----------------------
# Forecast Endpoint
# -----------------------

@app.post("/forecast", response_model=ForecastResponse)
def forecast(req: ForecastRequest):

    if model is None:
        return {
            "steps": req.steps,
            "forecast": [],
            "meta": {"error": "Model not loaded"}
        }

    # Hybrid Base-Multiplier Forecasting
    if req.history and len(req.history) >= 1:
        history = np.array(req.history)
        recent_avg = np.mean(history[-3:]) if len(history) > 0 else 0

        # Calculate local trend if enough points exist
        slope = np.polyfit(np.arange(len(history)), history, 1)[0] if len(history) >= 2 else 0

        forecast_vals = []
        global_seasonality = meta.get("seasonal_indices", {})
        current_month = datetime.now().month

        for i in range(1, req.steps + 1):
            target_month = (current_month + i - 1) % 12 + 1
            seasonal_multiplier = global_seasonality.get(str(target_month), 1.0)

            base_trend_val = recent_avg + slope * i
            # Cap base trend explosion (max 1.5x of recent avg)
            capped_base = max(0, min(base_trend_val, recent_avg * 1.5))
            
            # Apply global seasonal knowledge to user's local baseline
            final_forecast = capped_base * seasonal_multiplier
            forecast_vals.append(round(final_forecast, 2))

        response_meta = {
            **meta,
            "forecast_method": "hybrid_base_multiplier",
            "history_points": len(req.history),
            "forecast_currency": meta.get("training_currency", "USD"),
            "frontend_note": "Hybrid Forecast: User Baseline × Global Seasonality"
        }
    elif req.monthly_income and req.monthly_expense:
        # Use monthly income and expense for forecasting
        avg_savings = req.monthly_income - req.monthly_expense
        forecast_vals = [max(0, avg_savings) for _ in range(req.steps)]

        response_meta = {
            **meta,
            "forecast_method": "income_expense_based",
            "forecast_currency": meta.get("training_currency", "USD"),
            "frontend_note": "Forecast based on user's monthly income and expense."
        }
    else:
        # No data available
        forecast_vals = []
        response_meta = {
            **meta,
            "forecast_method": "no_data",
            "forecast_currency": meta.get("training_currency", "USD"),
            "frontend_note": "No user data available for forecasting."
        }

    return {
        "steps": req.steps,
        "forecast": forecast_vals,
        "meta": response_meta
    }


# -----------------------
# Recommendation Logic
# -----------------------

# Keywords for flexible category classification
ESSENTIAL_KEYWORDS = {
    "groceries", "food", "utility", "utilities", "power", "water", "gas",
    "healthcare", "medicine", "medical", "health", "rent", "housing", "mortgage",
    "education", "tuition", "school", "transport", "transportation", "fuel",
    "internet", "phone", "mobile", "insurance", "childcare", "daycare",
    "electricity", "sanitation", "basic needs"
}
DISCRETIONARY_KEYWORDS = {
    "entertainment", "movie", "game", "shopping", "clothes", "fashion",
    "dining", "restaurant", "cafe", "coffee", "subscription", "streaming",
    "travel", "vacation", "hotel", "flight", "investment", "crypto",
    "gym", "fitness", "hobby", "sports", "luxury", "electronics",
    "gifts", "decor", "events", "concerts", "alcohol", "bars"
}

def classify_category(cat_name: str) -> str:
    """Classify category as 'essential', 'discretionary', or 'other' (flexible matching)."""
    cat_lower = cat_name.lower().strip()  # Normalize input

    # Check if any keyword matches (substring search)
    for keyword in ESSENTIAL_KEYWORDS:
        if keyword in cat_lower:
            return "essential"
    for keyword in DISCRETIONARY_KEYWORDS:
        if keyword in cat_lower:
            return "discretionary"

    return "other"


@app.post("/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest):

    spends = req.category_spend_last30 or {}
    total_spend = sum(spends.values()) if spends else 0.0
    notes = []

    if req.monthly_budget <= 0:
        return {
            "suggested_category_budgets": {},
            "notes": ["Monthly budget must be > 0"]
        }

    suggested = {}

    # Base allocation: proportional to historical spending
    if total_spend > 0:
        for cat, amt in spends.items():
            if amt > 0:  # Only allocate for positive amounts
                share = amt / total_spend
                suggested[cat] = round(req.monthly_budget * share, 2)
                
                # Smart dynamic insights based on ratios
                if classify_category(cat) == "discretionary" and share > 0.30:
                    notes.append(f"⚠️ You are spending {share*100:.0f}% of your total expenses on {cat}. Try to reduce this.")
                elif cat.lower().strip() in ["food", "dining", "restaurant"] and share > 0.25:
                    notes.append(f"💡 {cat} takes up a huge chunk ({share*100:.0f}%). Meal prepping could save you hundreds!")
                
    else:
        # No history: use 50/30/20 rule
        suggested = {
            "Essential (Housing, Food, Utilities)": round(req.monthly_budget * 0.50, 2),
            "Discretionary (Entertainment, Dining)": round(req.monthly_budget * 0.30, 2),
            "Savings & Investments": round(req.monthly_budget * 0.20, 2),
        }
        notes.append("No spend history. Using 50/30/20 allocation: 50% Essential, 30% Discretionary, 20% Savings.")

    # Sanity checks
    if req.monthly_income <= 0:
        notes.append("Monthly income should be greater than 0.")
    elif req.monthly_income < req.monthly_budget:
        notes.append(f"⚠️ Budget ({req.monthly_budget}) exceeds income ({req.monthly_income}). Consider reducing discretionary spending.")
    elif req.monthly_budget < req.monthly_income * 0.7:
        notes.append("✓ Budget is healthy—leaves room for savings.")

    # Apply spending caps based on category classification
    discretionary_total = 0.0
    
    for cat, amt in suggested.items():
        if classify_category(cat) == "discretionary":
            discretionary_total += amt

    # Cap discretionary at 35% of budget
    max_discretionary = req.monthly_budget * 0.35
    if discretionary_total > max_discretionary:
        reduction_factor = max_discretionary / discretionary_total if discretionary_total > 0 else 1.0
        
        # Reduce each discretionary category proportionally
        for cat in list(suggested.keys()):
            if classify_category(cat) == "discretionary":
                suggested[cat] = round(suggested[cat] * reduction_factor, 2)
        
        notes.append(f"Discretionary capped at 35%. Adjusted from {discretionary_total:.2f} to {max_discretionary:.2f}.")

    # Ensure savings allocation if there's room
    total_allocated = sum(suggested.values())
    if total_allocated < req.monthly_budget and req.monthly_income > req.monthly_budget:
        savings_buffer = round(req.monthly_budget - total_allocated, 2)
        if savings_buffer > 0:
            suggested["Remaining (Savings/Emergency)"] = savings_buffer
            notes.append(f"Reserve {savings_buffer:.2f} for savings or emergency fund.")

    return {
        "suggested_category_budgets": suggested,
        "notes": notes
    }
