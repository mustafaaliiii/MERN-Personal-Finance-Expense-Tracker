export const BASE_URL = "http://localhost:5000";

export const API_PATHS = {
  AUTH: {
    LOGIN: "api/v1/auth/login",
    REGISTER: "api/v1/auth/register",
    GET_USER_INFO: "api/v1/auth/getUser",
    UPDATE_PROFILE: "api/v1/auth/updateProfile",
    DELETE_ACCOUNT: "api/v1/auth/deleteAccount",
  },

  DASHBOARD: {
    GET_DATA: "api/v1/dashboard",
  },

  INCOME: {
    ADD_INCOME: "api/v1/income/add",
    GET_ALL_INCOME: "api/v1/income/get",
    DELETE_INCOME: (incomeId) => `api/v1/income/${incomeId}`,
    DELETE_ALL_INCOME: "api/v1/income/all",
    DOWNLOAD_INCOME: "api/v1/income/downloadexcel",
    PARSE_CSV: "api/v1/income/parse-csv",
    BULK_ADD: "api/v1/income/bulk",
  },

  EXPENSE: {
    ADD_EXPENSE: "api/v1/expense/add",
    GET_ALL_EXPENSE: "api/v1/expense/get",
    DELETE_EXPENSE: (expenseId) => `api/v1/expense/${expenseId}`,
    DELETE_ALL_EXPENSE: "api/v1/expense/all",
    DOWNLOAD_EXPENSE: "api/v1/expense/downloadexcel",
    PARSE_CSV: "api/v1/expense/parse-csv",
    BULK_ADD: "api/v1/expense/bulk",
  },

  IMAGE: {
    UPLOAD_IMAGE: "api/v1/auth/upload-image",
  },

  // ✅ NEW AI PREDICTION ROUTES
  PREDICTION: {
    FORECAST: "api/v1/predict/forecast",
    RECOMMEND: "api/v1/predict/recommend",
  },

  ADMIN: {
    STATS: "api/v1/admin/stats",
    USERS: "api/v1/admin/users",
    USER_BY_ID: (userId) => `api/v1/admin/users/${userId}`,
    UPDATE_USER_ROLE: (userId) => `api/v1/admin/users/${userId}/role`,
    DELETE_USER: (userId) => `api/v1/admin/users/${userId}`,
    EXPENSES: "api/v1/admin/expenses",
    INCOMES: "api/v1/admin/incomes",
  },
};
