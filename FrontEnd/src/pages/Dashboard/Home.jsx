import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useEffect, useState, useContext } from "react";
import InfoCard from "../../components/Cards/InfoCard";
import { IoMdCard } from "react-icons/io";
import { LuHandCoins, LuWalletMinimal } from "react-icons/lu";
import { formatMoney, getCurrency } from "../../utils/currency";
import { convertSync, fetchRate } from "../../utils/exchange";
import RecentTransactions from "../../components/Dashboard/RecentTransactions";
import FinanceOverview from "../../components/Dashboard/FinanceOverview";
import ExpenseTransactions from "../../components/Dashboard/ExpenseTransactions";
import Last30DaysExpenses from "../../components/Dashboard/Last30DaysExpenses";
import RecentIncomeWithChart from "../../components/Dashboard/RecentIncomeWithChart";
import RecentIncome from "../../components/Dashboard/RecentIncome";
import CustomLineChart from "../../components/Charts/CustomLineChart";
import { UserContext } from "../../context/UserContext";

// ✅ NEW Forecast Component (AI Microservice via Node)
const ForecastPreview = ({ user, totalIncome, totalExpenses }) => {
  const [data, setData] = useState([]);
  const [forecastValues, setForecastValues] = useState([]);
  const [forecastCurrency, setForecastCurrency] = useState("PKR");
  const [currency, setCurrency] = useState(getCurrency());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch forecast data
  useEffect(() => {
    (async () => {
      if (totalIncome === undefined || totalExpenses === undefined) return;
      
      try {
        setLoading(true);
        setError(null);

        const income = totalIncome || 0;
        const expense = totalExpenses || 0;

        // Forecast next 3 months by default
        const res = await axiosInstance.post(API_PATHS.PREDICTION.FORECAST, {
          steps: 3,
          userId: user?._id,
          monthly_income: income,
          monthly_expense: expense,
        });

        // Get forecast currency from metadata (default PKR)
        const fCurrency = res.data?.meta?.forecast_currency || "PKR";
        setForecastCurrency(fCurrency);
        setForecastValues(res.data?.forecast || []);

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
        console.error("Error fetching AI forecast:", err);
        setError("Failed to fetch forecast data. Please try again later.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalIncome, totalExpenses]);

  // Recalculate data when currency changes
  useEffect(() => {
    const series = (forecastValues || []).map((val, i) => {
      const convertedVal = convertSync(val, forecastCurrency, currency);
      return {
        month: `M${i + 1}`,
        amount: Number(convertedVal?.toFixed ? convertedVal.toFixed(2) : convertedVal),
        category: "forecast",
      };
    });
    setData(series);
  }, [forecastValues, forecastCurrency, currency]);

  // Listen for currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      const newCurrency = getCurrency();
      setCurrency(newCurrency);

      // Ensure exchange rate is loaded for conversion
      if (newCurrency !== forecastCurrency) {
        fetchRate(forecastCurrency, newCurrency).catch(() => {});
      }
    };

    window.addEventListener("currencyChanged", handleCurrencyChange);
    return () => window.removeEventListener("currencyChanged", handleCurrencyChange);
  }, [forecastCurrency]);

  if (loading) {
    return <p>Loading forecast...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!forecastValues.length) {
    return <p className="text-gray-500">📊 No Forecast Available - Add some expense data to see AI-powered predictions.</p>;
  }

  return (
    <div className="mt-4">
      <CustomLineChart data={data} />
    </div>
  );
};

const HomePage = () => {
  const { user } = useContext(UserContext);

  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState(getCurrency());

  const fetchDashboardData = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(API_PATHS.DASHBOARD.GET_DATA);
      if (response.data) setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load exchange rate on component mount (USD to PKR for forecast conversion)
  useEffect(() => {
    fetchRate("USD", "PKR").catch(() => {});
  }, []);

  // Listen for currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      const newCurrency = getCurrency();
      setCurrency(newCurrency);
      // Rate is already cached by Profile.jsx before event is dispatched
    };

    window.addEventListener("currencyChanged", handleCurrencyChange);
    return () => window.removeEventListener("currencyChanged", handleCurrencyChange);
  }, []);

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="my-5 mx-auto text-slate-900 dark:text-slate-100">
        {/* Overview header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-medium">Overview</h3>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard
            icon={<IoMdCard />}
            label="Total Balance"
            value={formatMoney(dashboardData?.totalBalance || 0, currency)}
            color="bg-primary"
            currency={currency}
            showCurrency={false}
          />
          <InfoCard
            icon={<LuWalletMinimal />}
            label="Total Income"
            value={formatMoney(dashboardData?.totalIncome || 0, currency)}
            color="bg-orange-500"
            currency={currency}
            showCurrency={false}
          />
          <InfoCard
            icon={<LuHandCoins />}
            label="Total Expense"
            value={formatMoney(dashboardData?.totalExpenses || 0, currency)}
            color="bg-red-500"
            currency={currency}
            showCurrency={false}
          />
        </div>

        {/* Dashboard grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <RecentTransactions
            transactions={dashboardData?.recentTransactions || []}
            onSeeMore={() => navigate("/expense")}
          />

          <FinanceOverview
            totalBalance={dashboardData?.totalBalance || 0}
            totalIncome={dashboardData?.totalIncome || 0}
            totalExpense={dashboardData?.totalExpenses || 0}
          />

          <ExpenseTransactions
            transactions={dashboardData?.last30DaysExpenses?.transactions || []}
            onSeeMore={() => navigate("/expense")}
          />

          <Last30DaysExpenses
            data={dashboardData?.last30DaysExpenses?.transactions || []}
          />

          <RecentIncomeWithChart
            data={
              dashboardData?.last60DaysIncome?.transactions?.slice(0, 4) || []
            }
            totalIncome={dashboardData?.totalIncome || 0}
          />

          <RecentIncome
            transactions={dashboardData?.last60DaysIncome?.transactions || []}
            onSeeMore={() => navigate("/income")}
          />
        </div>

        {/* ✅ Forecast section */}
        <div className="card mt-6 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h5 className="text-lg">AI Forecast (Next 3 Months)</h5>
          </div>

          <ForecastPreview 
            user={user} 
            totalIncome={dashboardData?.totalIncome}
            totalExpenses={dashboardData?.totalExpenses}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HomePage;
