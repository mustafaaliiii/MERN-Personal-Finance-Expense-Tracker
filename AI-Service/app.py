from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import joblib
import json
from pathlib import Path
import numpy as np

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

    # 🔥 IMPORTANT: convert back from log space
    pred_log = model.get_forecast(steps=req.steps).predicted_mean
    pred = np.expm1(pred_log)

    forecast_vals = [max(0.0, float(x)) for x in pred.values]

    # Add forecast currency to metadata
    # NOTE: model is trained on the training_currency (USD)
    # so all forecast values are in that currency and must be converted
    # by frontend if user selects a different currency
    response_meta = {
        **meta, 
        "forecast_currency": meta.get("training_currency", "USD"),
        "frontend_note": "All forecast values are in the training_currency. Frontend should convert based on user's selected currency."
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
    "internet", "phone", "mobile", "insurance"
}
DISCRETIONARY_KEYWORDS = {
    "entertainment", "movie", "game", "shopping", "clothes", "fashion",
    "dining", "restaurant", "cafe", "coffee", "subscription", "streaming",
    "travel", "vacation", "hotel", "flight", "investment", "crypto",
    "gym", "fitness", "hobby", "sports"
}

def classify_category(cat_name: str) -> str:
    """Classify category as 'essential', 'discretionary', or 'other' (flexible matching)."""
    cat_lower = cat_name.lower().strip()
    
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
