import { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { formatMoney, getCurrency } from "../../utils/currency";

const RecommendationWidget = ({ last30DaysByCategory }) => {
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axiosInstance.post(API_PATHS.RECOMMEND, {
        monthly_income: Number(monthlyIncome),
        monthly_budget: Number(monthlyBudget),
        category_spend_last30: last30DaysByCategory || {},
      });

      setRecommendations(res.data?.suggested_category_budgets || null);
      setNotes(res.data?.notes || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 shadow p-4">
      <h3 className="text-lg font-semibold">Budget Recommendations</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Suggests category budgets based on last 30 days spending.
      </p>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          className="border rounded-lg px-3 py-2 bg-transparent"
          placeholder="Monthly Income (e.g., 120000)"
          value={monthlyIncome}
          onChange={(e) => setMonthlyIncome(e.target.value)}
        />
        <input
          className="border rounded-lg px-3 py-2 bg-transparent"
          placeholder="Monthly Budget (e.g., 90000)"
          value={monthlyBudget}
          onChange={(e) => setMonthlyBudget(e.target.value)}
        />
      </div>

      <button
        onClick={fetchRecommendations}
        className="mt-3 px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black"
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Recommendations"}
      </button>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      {recommendations && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Suggested Budgets ({getCurrency()})</h4>
          <div className="space-y-2">
            {Object.entries(recommendations).map(([cat, amt]) => (
              <div
                key={cat}
                className="flex items-center justify-between border rounded-lg px-3 py-2"
              >
                <span className="text-sm">{cat}</span>
                <span className="text-sm font-semibold">{formatMoney(amt, getCurrency())}</span>
              </div>
            ))}
          </div>

      {notes.length > 0 && (
        <div className="mt-3 space-y-1">
          <h4 className="font-semibold text-sm">Insights</h4>
          <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
            {notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}
        </div>
      )}
    </div>
  );
};

export default RecommendationWidget;
