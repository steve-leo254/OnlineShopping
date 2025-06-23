import React, { useState, useEffect } from "react";
import {
  Plus,
  Users,
  Search,
  Eye,
  EyeOff,
  Trash2,
  Shield,
  UserCheck,
  AlertCircle,
  CheckCircle,
  X,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

// Type definitions
interface User {
  id: string;
  username: string;
  email: string;
  role: "superadmin" | "admin" | "customer";
  created_at: string;
  status: "active";
}

interface Stats {
  total_superadmins: number;
  total_admins: number;
  total_customers: number;
  admins_this_month: number;
  customers_this_month: number;
  total_users: number;
}

interface Notification {
  type: "success" | "error" | "";
  message: string;
  show: boolean;
}

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ApiResponse<T> {
  items?: T[];
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
  detail?: string;
  access_token?: string;
}

const SuperAdminDashboard: React.FC = () => {
  const { token, role, isAuthenticated, login, logout } = useAuth();

  // Component-specific state
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_superadmins: 0,
    total_admins: 0,
    total_customers: 0,
    admins_this_month: 0,
    customers_this_month: 0,
    total_users: 0,
  });
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [notification, setNotification] = useState<Notification>({
    type: "",
    message: "",
    show: false,
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loginData, setLoginData] = useState<LoginData>({
    email: "",
    password: "",
  });
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const isSuperAdmin = isAuthenticated && role === "SUPERADMIN";

  // Utility function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Generic API call function
  const makeApiCall = async <T,>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(url, {
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${url}:`, error);
      throw error;
    }
  };

  useEffect(() => {
    if (isSuperAdmin && token) {
      const fetchInitialData = async () => {
        setLoading(true);
        try {
          const response = await makeApiCall<{ username: string }>(
            `${import.meta.env.VITE_API_BASE_URL}/me`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setCurrentUser(response.items?.[0] || null);
          await Promise.all([fetchUsers(token), fetchStats(token)]);
        } catch (error) {
          console.error("Failed to fetch initial data", error);
          showNotification(
            "error",
            "Failed to load dashboard data. Your session may have expired."
          );
          logout();
        }
        setLoading(false);
      };
      fetchInitialData();
    }
  }, [isSuperAdmin, token, pagination.page, searchTerm, roleFilter]);

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await makeApiCall<{ access_token: string }>(
        `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
        {
          method: "POST",
          body: JSON.stringify({
            email: loginData.email,
            password: loginData.password,
          }),
        }
      );
      if (response.access_token) {
        login(response.access_token);
        toast.success("Login successful!");
      }
    } catch (error: any) {
      toast.error(
        error.message || "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = (): void => {
    logout();
    toast.success("Logged out successfully");
  };

  const fetchUsers = async (authToken: string): Promise<void> => {
    setLoading(true);
    try {
      const searchParam = searchTerm
        ? `&search=${encodeURIComponent(searchTerm)}`
        : "";
      const roleParam =
        roleFilter !== "all" ? `&role_filter=${roleFilter}` : "";
      const response = await makeApiCall<User>(
        `${import.meta.env.VITE_API_BASE_URL}/superadmin/users?page=${
          pagination.page
        }&limit=${pagination.limit}${searchParam}${roleParam}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setUsers(response.items || []);
      setPagination((prev) => ({
        ...prev,
        total: response.total || 0,
        pages: response.pages || 0,
      }));
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (authToken: string): Promise<void> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/superadmin/stats`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }
      const statsData = await response.json();
      setStats(statsData as Stats);
    } catch (error: any) {
      handleApiError(error);
    }
  };

  const handleApiError = (error: any) => {
    if (error.message.includes("401") || error.message.includes("403")) {
      toast.error("Session expired or invalid. Please login again.");
      logout();
    } else {
      toast.error(error.message || "An unexpected error occurred.");
    }
  };

  const handleAddAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm() || !token) return;
    setLoading(true);

    const requestBody = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
    };

    console.log("Request Body:", JSON.stringify(requestBody));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/superadmin/create-admin`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to add admin");
      }

      resetForm();
      setShowAddForm(false);
      toast.success("Admin added successfully!");
      await Promise.all([fetchUsers(token), fetchStats(token)]);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?") || !token)
      return;
    try {
      await makeApiCall(
        `${import.meta.env.VITE_API_BASE_URL}/auth/superadmin/users/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("User deleted successfully");
      await Promise.all([fetchUsers(token), fetchStats(token)]);
    } catch (error: any) {
      handleApiError(error);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.username.trim()) errors.username = "Username is required";
    else if (formData.username.length < 3)
      errors.username = "Username must be at least 3 characters";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Please enter a valid email";
    if (!formData.password) errors.password = "Password is required";
    else if (formData.password.length < 8)
      errors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const showNotification = (
    type: "success" | "error",
    message: string
  ): void => {
    setNotification({ type, message, show: true });
    setTimeout(
      () => setNotification({ type: "", message: "", show: false }),
      4000
    );
  };

  const resetForm = (): void => {
    setFormData({ username: "", email: "", password: "", confirmPassword: "" });
    setFormErrors({});
    setShowAddForm(false);
  };

  // Handler functions
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchUsers(token!), fetchStats(token!)]);
    } catch (error) {
      handleApiError(error);
    } finally {
      setRefreshing(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
        {loading && !loginData.email && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20">
            <div className="flex items-center justify-center gap-2 text-gray-700 text-lg">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              Verifying session...
            </div>
          </div>
        )}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 w-full max-w-md border border-white/40 shadow-xl relative z-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Super Admin Login
            </h1>
            <p className="text-gray-600">
              Sign in to access the superadmin dashboard
            </p>
          </div>

          {notification.show && (
            <div
              className={`mb-6 p-4 rounded-lg border-l-4 ${
                notification.type === "success"
                  ? "bg-green-50 border-green-500 text-green-800"
                  : "bg-red-50 border-red-500 text-red-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === "success" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span>{notification.message}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Super Admin Dashboard
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Welcome, {currentUser?.username || "User"} | Manage system
                  users
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 bg-white/80 hover:bg-white text-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm border border-white/40 shadow-sm"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
        {notification.show && (
          <div
            className={`mb-6 p-4 rounded-lg border-l-4 ${
              notification.type === "success"
                ? "bg-green-50 border-green-500 text-green-800"
                : "bg-red-50 border-red-500 text-red-800"
            } backdrop-blur-sm`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="flex-1">{notification.message}</span>
              <button
                onClick={() =>
                  setNotification({ ...notification, show: false })
                }
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {/* Total Superadmins */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow-sm min-h-[100px] flex items-center">
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 bg-purple-600 rounded-lg flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs font-medium truncate">
                  Total Superadmins
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.total_superadmins}
                </p>
              </div>
            </div>
          </div>

          {/* Total Admins */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow-sm min-h-[100px] flex items-center">
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 bg-blue-600 rounded-lg flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs font-medium truncate">
                  Total Admins
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.total_admins}
                </p>
              </div>
            </div>
          </div>

          {/* Total Customers */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow-sm min-h-[100px] flex items-center">
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 bg-orange-600 rounded-lg flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs font-medium truncate">
                  Total Customers
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.total_customers}
                </p>
              </div>
            </div>
          </div>

          {/* New Admins This Month */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow-sm min-h-[100px] flex items-center sm:col-span-1 lg:col-span-1 xl:col-span-1">
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 bg-green-600 rounded-lg flex-shrink-0">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs font-medium truncate">
                  New Admins (Month)
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.admins_this_month}
                </p>
              </div>
            </div>
          </div>

          {/* New Customers This Month */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow-sm min-h-[100px] flex items-center sm:col-span-2 lg:col-span-3 xl:col-span-1">
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 bg-indigo-600 rounded-lg flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs font-medium truncate">
                  New Customers (Month)
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.customers_this_month}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/40 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-4 w-full sm:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 bg-white/80 border border-white/40 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <select
                value={roleFilter}
                onChange={handleRoleFilterChange}
                className="bg-white/80 border border-white/40 rounded-lg text-gray-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All Roles</option>
                <option value="superadmin">Superadmin</option>
                <option value="admin">Admin</option>
                <option value="customer">Customer</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Add New Admin
            </button>
          </div>
        </div>
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Add New Admin
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className={`w-full px-3 py-2 bg-white border ${
                      formErrors.username ? "border-red-500" : "border-gray-300"
                    } rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
                    placeholder="Enter username"
                    disabled={loading}
                  />
                  {formErrors.username && (
                    <p className="text-red-600 text-sm mt-1">
                      {formErrors.username}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={`w-full px-3 py-2 bg-white border ${
                      formErrors.email ? "border-red-500" : "border-gray-300"
                    } rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
                    placeholder="Enter email"
                    disabled={loading}
                  />
                  {formErrors.email && (
                    <p className="text-red-600 text-sm mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className={`w-full px-3 py-2 pr-10 bg-white border ${
                        formErrors.password
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
                      placeholder="Enter password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-red-600 text-sm mt-1">
                      {formErrors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 pr-10 bg-white border ${
                        formErrors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
                      placeholder="Confirm password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1">
                      {formErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? "Adding..." : "Add Admin"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                    Role
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                    Created
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 sm:px-6 py-8 text-center text-gray-500"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 sm:px-6 py-8 text-center text-gray-500"
                    >
                      {searchTerm
                        ? "No users found matching your search"
                        : "No users found"}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-sm sm:text-base">
                              {user.username
                                ? user.username.charAt(0).toUpperCase()
                                : "U"}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-900 font-medium truncate">
                              {user.username || "Unknown"}
                            </p>
                            <p className="text-gray-500 text-sm truncate">
                              {user.email || "No email"}
                            </p>
                            <div className="sm:hidden mt-1">
                              <p className="text-gray-500 text-xs">
                                Role: {user.role}
                              </p>
                              <p className="text-gray-500 text-xs">
                                Created: {formatDate(user.created_at)}
                              </p>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 bg-green-100 text-green-800 border border-green-200">
                                {user.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-gray-700 text-sm hidden sm:table-cell">
                        {user.role}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-gray-700 text-sm hidden sm:table-cell">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {user.role !== "superadmin" && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Showing{" "}
                {pagination.total > 0
                  ? Math.min(
                      (pagination.page - 1) * pagination.limit + 1,
                      pagination.total
                    )
                  : 0}{" "}
                to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm">
                  {pagination.page}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
