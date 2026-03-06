import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { getCurrency, formatMoney } from "../../utils/currency";
import { convertSync, fetchRate } from "../../utils/exchange";

// If you already have a custom chart component, replace this with yours.
// Example: import CustomLineChart from "../Charts/CustomLineChart";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const ForecastWidget = () => {
  const [steps, setSteps] = useState(3);
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState("");
  const [forecastCurrency, setForecastCurrency] = useState("PKR");
  const [currency, setCurrency] = useState(getCurrency());
  const [rateReady, setRateReady] = useState(false); // ✅ Track if rate is cached

  const chartData = useMemo(() => {
    if (!rateReady) return []; // Don't render until rate is ready
    
    return forecast.map((val, i) => {
      const convertedVal = convertSync(val, forecastCurrency, currency);
      
      return {
        month: `M${i + 1}`,
        predicted: convertedVal,
      };
    });
  }, [forecast, forecastCurrency, currency, rateReady]); // ✅ Add rateReady dependency

  const fetchForecast = async (forecastSteps = steps) => {
    try {
      setLoading(true);
      setError("");

      const res = await axiosInstance.post(API_PATHS.FORECAST, {
        steps: Number(forecastSteps),
      });

      // expected: { steps: 3, forecast: [..], meta: {...} }
      const fcCurrency = res.data?.meta?.forecast_currency || "PKR";
      setForecastCurrency(fcCurrency);
      
      // ✅ CRITICALLY: Fetch and cache rate FIRST
      const userCurrency = getCurrency();
      if (userCurrency !== fcCurrency) {
        await fetchRate(fcCurrency, userCurrency);
      }
      
      // Only AFTER rate is cached, set forecast to trigger re-render
      setForecast(res.data?.forecast || []);
      setRateReady(true); // ✅ Signal that rate is cached and ready
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load forecast");
      setRateReady(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(steps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load exchange rate on component mount (USD to PKR for forecast conversion)
  useEffect(() => {
    fetchRate("USD", "PKR").catch(() => {});
  }, []);

  // Listen for currency changes and exchange rate updates
  useEffect(() => {
    const handleCurrencyChange = async () => {
      const newCurrency = getCurrency();
      setCurrency(newCurrency);
      
      // Fetch rate for new currency and wait for it to be cached
      if (newCurrency !== forecastCurrency) {
        await fetchRate(forecastCurrency, newCurrency);
      }
      
      setRateReady(true); // Trigger re-render with new rate
    };

    const handleExchangeRateUpdate = () => {
      setRateReady(true); // Re-render when rate updates
    };

    window.addEventListener("currencyChanged", handleCurrencyChange);
    window.addEventListener("exchangeRateUpdated", handleExchangeRateUpdate);
    
    return () => {
      window.removeEventListener("currencyChanged", handleCurrencyChange);
      window.removeEventListener("exchangeRateUpdated", handleExchangeRateUpdate);
    };
  }, [forecastCurrency]);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 shadow p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Expense Forecast</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Predicted expenses for upcoming months (SARIMAX / ARIMA).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="border rounded-lg px-2 py-1 bg-transparent"
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
          >
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
          </select>

          <button
            onClick={() => fetchForecast(steps)}
            className="px-3 py-1 rounded-lg bg-black text-white dark:bg-white dark:text-black"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 text-sm text-red-600">{error}</div>
      ) : (
        <div className="mt-4 h-64">
          {forecast.length === 0 && !loading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No forecast data yet.
            </div>
          ) : loading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Loading forecast...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatMoney(value, currency), "forecast"]}
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderColor: '#ccc',
                    borderRadius: '8px',
                  }}
                />
                <Line type="monotone" dataKey="predicted" strokeWidth={2} dot name={currency} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
};

export default ForecastWidget;
