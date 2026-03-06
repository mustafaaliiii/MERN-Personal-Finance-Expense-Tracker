# Currency Handling in Expense Tracker

## Overview

The AI model and frontend work together to support multiple currencies. Here's how it works:

---

## 1. **Training Phase (train.py)**

- Dataset: **USD values** (~$1000-$4000/month)
- Model trains on raw USD data `monthly_expense_total`
- Metadata includes: `"training_currency": "USD"`
- Forecast is generated in **USD** (same currency as training data)

**Key Point**: The SARIMAX model learns patterns from USD data, so its forecasts are in USD.

---

## 2. **Prediction API (app.py)**

### Forecast Endpoint `/forecast`

**Response includes:**
```json
{
  "forecast": [2500.50, 2700.30, 2800.15],
  "meta": {
    "training_currency": "USD",
    "forecast_currency": "USD",
    "frontend_note": "Convert based on user's selected currency"
  }
}
```

**Important**:
- `forecast_currency` tells frontend: **These values are in USD**
- Frontend must convert USD → User's preferred currency using exchange rate

### Recommendation Endpoint `/recommend`

**Input:**
```json
{
  "monthly_income": 5000,
  "monthly_budget": 4000,
  "category_spend_last30": {"Groceries": 800, "Utilities": 300}
}
```

**Output:**
```json
{
  "suggested_category_budgets": {
    "Groceries": 1000.00,
    "Utilities": 450.00,
    "Remaining (Savings/Emergency)": 2550.00
  },
  "notes": ["Budget is healthy—leaves room for savings."]
}
```

**Important**: 
- Recommendations are proportional allocations
- Currency is whatever user provides (no conversion needed)
- If user inputs PKR amounts, recommendations are in PKR

---

## 3. **Frontend Currency Conversion**

### Flow:

1. **User selects currency in Profile** → Sets `localStorage['currency']`
2. **Components listen to `currencyChanged` event**
3. **For Forecast display:**
   - Fetch forecast from API → Get USD values
   - Check metadata: `forecast_currency === "USD"`
   - Convert: `convertSync(usdValue, "USD", userCurrency)`
   - Display with `formatMoney(convertedValue, userCurrency)`

### Key File: `src/utils/exchange.js`

```javascript
convertSync(amount, fromCurrency, toCurrency)
// Example: convertSync(2500, "USD", "PKR") → ~625000
```

---

## 4. **Currency Support Matrix**

| Location | Currency | Source | Conversion |
|----------|----------|--------|-----------|
| Model Training | USD | Dataset | Auto-learns |
| Forecast API | USD | Model output | Metadata indicates USD |
| Recommendation API | Variable | User input | Proportional (no conversion) |
| Frontend Display | User selected | localStorage | Exchange rate applied |

---

## 5. **Adding New Training Currency**

If you want to train on PKR data instead:

### Step 1: Prepare dataset with PKR values
```csv
date,monthly_expense_total,...
2019-01-01,125000,...  // PKR values instead of USD
```

### Step 2: Update meta in train.py
```python
meta = {
    "training_currency": "PKR",  // Change from USD
    ...
}
```

### Step 3: No frontend changes needed!
- API still returns `forecast_currency: "PKR"`
- Frontend converts PKR → User's currency
- Same logic works for any currency

---

## 6. **Testing Currency Conversion**

### Test Scenario 1: Model trained in USD, user wants PKR

```
Model forecast (USD): $2,500
Exchange rate: 1 USD = 250 PKR
Frontend converts: ✓ 
Display value (PKR): Rs 625,000
```

### Test Scenario 2: Recommendation with PKR amounts

```
User inputs:
  - monthly_income: 500,000 (PKR)
  - monthly_budget: 400,000 (PKR)
  
API returns:
  - Groceries: 100,000 (PKR)
  - Utilities: 50,000 (PKR)
  
Display: ✓ (No conversion needed - input currency = output currency)
```

---

## 7. **Current Implementation Status**

✅ **Complete:**
- Model trains on USD data
- Forecast includes currency metadata
- Frontend converts USD ↔ PKR dynamically
- Exchange rate caching (6-hour TTL)
- Pre-fetch on currency change (instant updates)

✅ **Tested:**
- Dashboard cards show correct currency
- Charts update on currency change
- Forecast displays correct converted values
- Recommendations work with any input currency

---

## 8. **Troubleshooting**

**Issue**: Forecast shows as USD when PKR is selected
- **Solution**: Ensure meta.json has `"forecast_currency": "USD"`
- **Check**: `GET /health` endpoint in FastAPI

**Issue**: Conversion shows wrong amount
- **Solution**: Verify exchange rate via `src/utils/exchange.js`
- **Check**: Open browser DevTools → Console → `getCachedRate("USD", "PKR")`

**Issue**: Recommendations always in USD
- **Solution**: User must input their currency on frontend (PKR)
- **Check**: Input form in Expense.jsx uses correct currency units

---

## 9. **Exchange Rate Source**

- **Provider**: exchangerate.host (free, no API key)
- **Update**: Real-time (fetched on demand)
- **Cache**: 6 hours in localStorage
- **Fallback**: Falls back to last known rate if API unavailable

---

## Summary

**The model is USD-centric by design:**
- Trains on USD data
- Outputs USD forecasts
- Frontend handles all conversions

This approach is flexible because:
1. One model works for all currencies
2. No need to retrain for new currencies
3. Exchange rates stay current
4. Users see their preferred currency everywhere

To train on a different currency, simply update the dataset and `training_currency` in meta.json.
