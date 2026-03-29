import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { addThousandsSeparator } from "../../utils/helper";
import { UserContext } from "../../context/UserContext";

const AdminIncomes = () => {
  const { user, loading: userLoading } = useContext(UserContext);
  const navigate = useNavigate();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && (!user || (user.role !== 'admin' && user.role !== 'superadmin'))) {
      navigate('/dashboard');
      return;
    }

    if (user?.role === 'admin' || user?.role === 'superadmin') {
      fetchIncomes();
    }
  }, [user, userLoading, navigate]);

  const fetchIncomes = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.ADMIN.INCOMES);
      setIncomes(response.data);
    } catch (error) {
      console.error("Error fetching incomes:", error);
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
        <h1 className="text-2xl font-semibold mb-6">All Incomes</h1>

        <div className="theme-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {incomes.map((income) => (
                  <tr key={income._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium theme-text">
                        {income.userId?.fullName || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {income.userId?.email || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium theme-text">
                        {addThousandsSeparator(income.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm theme-text">{income.source}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm theme-text">
                        {new Date(income.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm theme-text">{income.description || '-'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminIncomes;