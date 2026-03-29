import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import Modal from "../../components/Modal";
import ConfirmAlert from "../../components/ConfirmAlert";
import toast from "react-hot-toast";
import { UserContext } from "../../context/UserContext";

const AdminUsers = () => {
  const { user, loading: userLoading } = useContext(UserContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!userLoading && (!user || (user.role !== 'admin' && user.role !== 'superadmin'))) {
      navigate('/dashboard');
      return;
    }

    if (user?.role === 'admin' || user?.role === 'superadmin') {
      fetchUsers();
    }
  }, [user, userLoading, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.ADMIN.USERS);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axiosInstance.put(API_PATHS.ADMIN.UPDATE_USER_ROLE(userId), { role: newRole });
      toast.success("User role updated successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await axiosInstance.delete(API_PATHS.ADMIN.DELETE_USER(selectedUser._id));
      toast.success("User deleted successfully");
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
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
        <h1 className="text-2xl font-semibold mb-6">User Management</h1>

        <div className="theme-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium theme-text">{u.fullName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm theme-text">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-700 theme-text"
                        disabled={user?.role !== 'superadmin'}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                      {user?.role !== 'superadmin' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Only superadmins can change roles.</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm theme-text">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user?.role === 'superadmin' ? (
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Only superadmin can delete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
      >
        <ConfirmAlert
          content={`Are you sure you want to delete user "${selectedUser?.fullName}"? This will also delete all their expenses and incomes.`}
          onConfirm={handleDeleteUser}
          confirmContent="Delete User"
          color="error"
        />
      </Modal>
    </DashboardLayout>
  );
};

export default AdminUsers;