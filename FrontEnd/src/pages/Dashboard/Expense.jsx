import { useState, useEffect, useMemo, useContext } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { toast } from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import ExpenseOverview from "../../components/Expense/ExpenseOverview";
import AddExpenseForm from "../../components/Expense/AddExpenseForm";
import UploadCsvForm from "../../components/Expense/UploadCsvForm";
import Modal from "../../components/Modal";
import ExpenseList from "../../components/Expense/ExpenseList";
import { UserContext } from "../../context/UserContext";
import ConfirmAlert from "../../components/ConfirmAlert";
import CustomLineChart from "../../components/Charts/CustomLineChart";
import { formatMoney, getCurrency } from "../../utils/currency";
import { convertSync, fetchRate } from "../../utils/exchange";

const ExpensePage = () => {
  const { user } = useContext(UserContext);
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDeleteAlert, setOpenDeleteAlert] = useState({
    show: false,
    data: null,
  });
  const [openAddExpenseModal, setOpenAddExpenseModal] = useState(false);
  const [openCsvModal, setOpenCsvModal] = useState(false);

  // ✅ AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [forecastSteps, setForecastSteps] = useState(3);
  const [forecastData, setForecastData] = useState([]);
  const [forecastRawValues, setForecastRawValues] = useState([]);
  const [forecastCurrency, setForecastCurrency] = useState("PKR");
  const [currency, setCurrency] = useState(getCurrency());
  const [recommendations, setRecommendations] = useState(null);
  const [recNotes, setRecNotes] = useState([]);

  // Inputs for recommendation
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("");

  const closeAddExpenseModal = () => setOpenAddExpenseModal(false);

  const fetchExpenseTransactions = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await axiosInstance.get(API_PATHS.EXPENSE.GET_ALL_EXPENSE);
      if (response.data) setExpenseData(response.data);
    } catch (error) {
      console.error("Error fetching expense transactions:", error);
      toast.error("Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (expense) => {
    const { category, amount, date, icon } = expense;

    if (!category?.trim()) return toast.error("Category is required!");
    if (!amount || isNaN(amount) || Number(amount) <= 0)
      return toast.error("Amount must be a valid number greater than 0!");
    if (!date) return toast.error("Date is required!");

    try {
      await axiosInstance.post(API_PATHS.EXPENSE.ADD_EXPENSE, {
        category,
        amount: Number(amount),
        date,
        icon,
      });

      closeAddExpenseModal();
      toast.success("Expense added successfully!");
      fetchExpenseTransactions();
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense.");
    }
  };

  const deleteExpense = async (id) => {
    try {
      await axiosInstance.delete(API_PATHS.EXPENSE.DELETE_EXPENSE(id));
      setOpenDeleteAlert({ show: false, data: null });
      toast.success("Expense deleted successfully!");
      fetchExpenseTransactions();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense.");
    }
  };

  const handleDownloadExpenseDetails = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.EXPENSE.DOWNLOAD_EXPENSE, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "expense_details.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading expense details:", error);
      toast.error("Failed to download expense details.");
    }
  };

  // ✅ Last 30 days spend by category (for recommendation input)
  const last30DaysByCategory = useMemo(() => {
    // supports both shapes: response array OR { transactions: [] }
    const tx = Array.isArray(expenseData)
      ? expenseData
      : expenseData?.transactions || [];

    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - 30);

    const map = {};
    tx.forEach((t) => {
      const d = new Date(t.date || t.createdAt || t.updatedAt);
      if (Number.isNaN(d.getTime())) return;
      if (d < cutoff) return;

      const cat = t.category || "Other";
      const amt = Number(t.amount || 0);
      map[cat] = (map[cat] || 0) + amt;
    });

    return map;
  }, [expenseData]);

  // ✅ Fetch AI Forecast
  const fetchForecast = async () => {
    try {
      setAiLoading(true);

      const res = await axiosInstance.post(API_PATHS.PREDICTION.FORECAST, {
        steps: Number(forecastSteps),
        userId: user?._id,
      });

      // Get forecast currency from metadata (default PKR)
      const fCurrency = res.data?.meta?.forecast_currency || "PKR";
      setForecastCurrency(fCurrency);
      setForecastRawValues(res.data?.forecast || []);
      
      // Ensure exchange rate is loaded
      const userCurrency = getCurrency();
      if (userCurrency !== fCurrency) {
        try {
          await fetchRate(fCurrency, userCurrency);
        } catch (e) {
          console.warn("Could not fetch exchange rate:", e);
        }
      }
    } catch (err) {
      console.error("Error fetching forecast:", err);
      toast.error("Failed to load AI forecast.");
    } finally {
      setAiLoading(false);
    }
  };

  // Recalculate forecast data when currency changes
  useEffect(() => {
    const series = (forecastRawValues || []).map((val, i) => {
      const convertedVal = convertSync(val, forecastCurrency, currency);
      return {
        month: `M${i + 1}`,
        amount: Number(convertedVal?.toFixed ? convertedVal.toFixed(2) : convertedVal),
        category: "forecast",
      };
    });
    setForecastData(series);
  }, [forecastRawValues, forecastCurrency, currency]);

  // Listen for currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      const newCurrency = getCurrency();
      setCurrency(newCurrency);
      // Rate is already cached by Profile.jsx before event is dispatched
    };

    window.addEventListener("currencyChanged", handleCurrencyChange);
    return () => window.removeEventListener("currencyChanged", handleCurrencyChange);
  }, [forecastCurrency]);

  // ✅ Fetch AI Recommendations
  const fetchRecommendations = async () => {
    if (!monthlyIncome || Number(monthlyIncome) <= 0) {
      return toast.error("Enter a valid monthly income.");
    }
    if (!monthlyBudget || Number(monthlyBudget) <= 0) {
      return toast.error("Enter a valid monthly budget.");
    }

    try {
      setAiLoading(true);

      const res = await axiosInstance.post(API_PATHS.PREDICTION.RECOMMEND, {
        monthly_income: Number(monthlyIncome),
        monthly_budget: Number(monthlyBudget),
        category_spend_last30: last30DaysByCategory,
      });

      setRecommendations(res.data?.suggested_category_budgets || null);
      setRecNotes(res.data?.notes || []);
      toast.success("Recommendations generated!");
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      toast.error("Failed to get recommendations.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto load forecast once on page open
  useEffect(() => {
    fetchForecast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load exchange rate on component mount (USD to PKR for forecast conversion)
  useEffect(() => {
    fetchRate("USD", "PKR").catch(() => {});
  }, []);

  return (
    <DashboardLayout activeMenu="Expense">
      <div className="my-5 mx-auto text-slate-900 dark:text-slate-100">
        {/* ✅ AI Forecast + Recommendation section */}
        <div className="card mb-6">
          <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
            <div>
              <h3 className="text-lg font-semibold">AI Insights</h3>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Forecast upcoming expenses and generate budget recommendations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="input-box w-auto"
                value={forecastSteps}
                onChange={(e) => setForecastSteps(Number(e.target.value))}
              >
                <option value={3}>Next 3 months</option>
                <option value={6}>Next 6 months</option>
                <option value={12}>Next 12 months</option>
              </select>

              <button
                onClick={fetchForecast}
                disabled={aiLoading}
                className="px-4 py-2 rounded-lg primary-btn-fill"
              >
                {aiLoading ? "Loading..." : "Refresh Forecast"}
              </button>
            </div>
          </div>

          <div className="mt-4">
            {forecastData.length ? (
              <CustomLineChart data={forecastData} />
            ) : (
              <div className="text-sm text-muted">
                No forecast data yet.
              </div>
            )}
          </div>

          {/* ✅ Recommendation inputs */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="input-box"
              placeholder="Monthly Income (e.g., 120000)"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
            />
            <input
              className="input-box"
              placeholder="Monthly Budget (e.g., 90000)"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
            />
            <button
              onClick={fetchRecommendations}
              disabled={aiLoading}
              className="px-4 py-2 rounded-lg primary-btn-fill"
            >
              {aiLoading ? "Generating..." : "Generate Recommendations"}
            </button>
          </div>

          {/* ✅ Recommendations result */}
          {recommendations && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Suggested Category Budgets</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(recommendations).map(([cat, amt]) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between border rounded-lg px-3 py-2"
                  >
                    <span className="text-sm">{cat}</span>
                        <span className="text-sm font-semibold">
                          {formatMoney(Number(amt || 0))}
                        </span>
                  </div>
                ))}
              </div>

              {recNotes.length > 0 && (
                <div className="mt-3 space-y-1">
                  <h4 className="font-semibold text-sm">Insights</h4>
                  <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                    {recNotes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Existing Expense Overview + List */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <ExpenseOverview
              transactions={expenseData}
              loading={loading}
              onAddExpense={() => setOpenAddExpenseModal(true)}
              onUploadCsv={() => setOpenCsvModal(true)}
            />
          </div>

          <ExpenseList
            transactions={expenseData}
            loading={loading}
            onDelete={(id) => setOpenDeleteAlert({ show: true, data: id })}
            onDownload={handleDownloadExpenseDetails}
          />
        </div>

        {/* Upload CSV Modal */}
        <Modal
          isOpen={openCsvModal}
          onClose={() => setOpenCsvModal(false)}
          title="Upload Bank Statement (PDF/CSV/Excel)"
        >
          <UploadCsvForm 
            onSuccess={() => { setOpenCsvModal(false); fetchExpenseTransactions(); }}
            onCancel={() => setOpenCsvModal(false)}
          />
        </Modal>

        {/* Add Expense Modal */}
        <Modal
          isOpen={openAddExpenseModal}
          onClose={closeAddExpenseModal}
          title="Add Expense"
        >
          <AddExpenseForm onAddExpense={handleAddExpense} />
        </Modal>

        {/* Delete Confirm Modal */}
        <Modal
          isOpen={openDeleteAlert.show}
          onClose={() => setOpenDeleteAlert({ show: false, data: null })}
          title="Delete Expense"
        >
          <ConfirmAlert
            content="Are you sure you want to delete this expense transaction?"
            onConfirm={() => deleteExpense(openDeleteAlert.data)}
            confirmContent="Delete"
            color="error"
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default ExpensePage;
