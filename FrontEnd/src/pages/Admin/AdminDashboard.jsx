import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import InfoCard from "../../components/Cards/InfoCard";
import { IoMdCard } from "react-icons/io";
import { LuHandCoins, LuWalletMinimal, LuUsers } from "react-icons/lu";
import { addThousandsSeparator } from "../../utils/helper";
import { UserContext } from "../../context/UserContext";

const AdminDashboard = () => {
  const { user, loading: userLoading } = useContext(UserContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && (!user || (user.role !== 'admin' && user.role !== 'superadmin'))) {
      navigate('/dashboard');
      return;
    }

    if (user?.role === 'admin' || user?.role === 'superadmin') {
      fetchStats();
    }
  }, [user, userLoading, navigate]);

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.ADMIN.STATS);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || loading) {
    return (
      <DashboardLayout activeMenu="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return null;
  }

  return (
    <DashboardLayout activeMenu="Admin Dashboard">
      <div className="my-5 mx-7">
        <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <InfoCard
            icon={<LuUsers />}
            label="Total Users"
            value={addThousandsSeparator(stats?.totalUsers || 0)}
            color="bg-blue-500"
          />
          <InfoCard
            icon={<LuHandCoins />}
            label="Total Expenses"
            value={addThousandsSeparator(stats?.totalExpenses || 0)}
            color="bg-red-500"
          />
          <InfoCard
            icon={<LuWalletMinimal />}
            label="Total Incomes"
            value={addThousandsSeparator(stats?.totalIncomes || 0)}
            color="bg-green-500"
          />
          <InfoCard
            icon={<IoMdCard />}
            label="Net Balance"
            value={addThousandsSeparator((stats?.totalIncomeAmount || 0) - (stats?.totalExpenseAmount || 0))}
            color="bg-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="theme-card p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/admin/users'}
                className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Manage Users
              </button>
              <button
                onClick={() => window.location.href = '/admin/expenses'}
                className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                View All Expenses
              </button>
              <button
                onClick={() => window.location.href = '/admin/incomes'}
                className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                View All Incomes
              </button>
            </div>
          </div>

          <div className="theme-card p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">System Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Expense Amount:</span>
                <span className="font-medium">{addThousandsSeparator(stats?.totalExpenseAmount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Income Amount:</span>
                <span className="font-medium">{addThousandsSeparator(stats?.totalIncomeAmount || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;