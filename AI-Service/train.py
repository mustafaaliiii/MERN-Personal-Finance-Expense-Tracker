import json
import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
import joblib
from pathlib import Path

DATA_PATH = Path(r"C:/Users/TechPro/Downloads/fyp-updateOCR/MERN-Fullstack-Expense-Tracker-main/AI-Service/data/personal_finance_tracker_dataset.csv")

OUT_DIR = Path("models")
OUT_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = OUT_DIR / "sarimax_expense.pkl"
META_PATH = OUT_DIR / "meta.json"

def winsorize(s: pd.Series, lower_q=0.01, upper_q=0.99) -> pd.Series:
    lo = s.quantile(lower_q)
    hi = s.quantile(upper_q)
    return s.clip(lo, hi)

def fit_model(y_log: pd.Series):
    """
    Stable default seasonal model for monthly data:
    - Avoids too many parameters
    - Avoids explosive behavior in many datasets
    """
    model = SARIMAX(
        y_log,
        order=(0, 1, 1),
        seasonal_order=(0, 1, 1, 12),
        enforce_stationarity=False,
        enforce_invertibility=False,
    )
    return model.fit(disp=False, maxiter=400)

def main():
    # Load and validate data
    if not DATA_PATH.exists():
        print(f"❌ Data file not found: {DATA_PATH}")
        return
    
    df = pd.read_csv(DATA_PATH)
    
    if df.empty:
        print("❌ Dataset is empty")
        return

    # safe date parse
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"]).sort_values("date")
    
    if df.empty:
        print("❌ No valid dates in dataset")
        return
    
    if "monthly_expense_total" not in df.columns:
        print("❌ 'monthly_expense_total' column not found in dataset")
        return

    # monthly aggregation
    # NOTE: dataset contains multiple users per month. Summing across users
    # produces a total across the dataset (large values). For a per-user
    # forecast (matching typical UI expectations) we use the monthly mean
    # (average per-user monthly expense). Change to `.sum()` if you want
    # a dataset-wide total forecast instead.
    monthly = (
        df.groupby(pd.Grouper(key="date", freq="MS"))["monthly_expense_total"]
        .mean()
        .sort_index()
        .asfreq("MS")
        .fillna(0.0)
    )

    # Validate we have enough data points
    if len(monthly) < 4:
        print(f"⚠️ Warning: Only {len(monthly)} months of data. SARIMAX works better with 24+ points.")

    # basic sanity: non-negative
    monthly = monthly.clip(lower=0)

    # outlier handling (VERY important for stability)
    monthly_clean = winsorize(monthly, 0.01, 0.99)

    # log transform
    y_log = np.log1p(monthly_clean)

    # fit
    res = fit_model(y_log)

    # test forecast in log space then invert
    pred_log = res.get_forecast(steps=3).predicted_mean
    pred = np.expm1(pred_log).clip(lower=0)

    # if forecast is insane, fallback to a simpler model
    if (np.isinf(pred).any()) or (pred.max() > monthly_clean.max() * 10 + 1):
        print("⚠️ Forecast looked unstable. Falling back to non-seasonal MA model...")
        model2 = SARIMAX(
            y_log,
            order=(0, 1, 1),
            seasonal_order=(0, 0, 0, 0),
            enforce_stationarity=False,
            enforce_invertibility=False,
        )
        res = model2.fit(disp=False, maxiter=400)
        pred_log = res.get_forecast(steps=3).predicted_mean
        pred = np.expm1(pred_log).clip(lower=0)

    joblib.dump(res, MODEL_PATH)

    meta = {
        "series_start": str(monthly.index.min().date()),
        "series_end": str(monthly.index.max().date()),
        "freq": "MS",
        "target": "monthly_expense_total(mean_per_user)",
        "aggregation": "mean_per_user",
        "training_currency": "USD",
        "log_transform": True,
        "outlier_winsorize": {"lower_q": 0.01, "upper_q": 0.99},
        "model_used": str(res.model.order) + " seasonal " + str(res.model.seasonal_order),
        "n_points": int(len(monthly)),
        "mean_monthly_observed": float(monthly.mean()),
        "max_monthly_observed": float(monthly.max()),
        "min_monthly_observed": float(monthly.min()),
        "max_monthly_used_after_cleaning": float(monthly_clean.max()),
        "forecast_steps": 3,
        "forecast_sample": [round(float(x), 2) for x in pred],
        "model_aic": float(res.aic) if hasattr(res, 'aic') else None,
        "training_timestamp": pd.Timestamp.now().isoformat(),
    }
    META_PATH.write_text(json.dumps(meta, indent=2))

    print("✅ Trained and saved:", MODEL_PATH)
    print("ℹ️ Meta saved:", META_PATH)
    print("📈 Sample forecast (next 3 months):")
    print(pred)

if __name__ == "__main__":
    main()
