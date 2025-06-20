// src/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

interface LoginFormData {
  email: string;
  password: string;
}

interface ApiResponse {
  access_token: string;
}

interface Alert {
  type: "success" | "error" | "warning" | "info";
  message: string;
}

const Login: React.FC = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear alert when user starts typing
    if (alert) setAlert(null);
  };

  const showAlert = (type: Alert["type"], message: string) => {
    setAlert({ type, message });
    // Auto-hide alert after 5 seconds
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    // Basic validation
    if (!formData.email || !formData.password) {
      showAlert("error", "Please fill in all fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const apiUrl = `${API_BASE_URL}/auth/login`;
      const response = await axios.post<ApiResponse>(apiUrl, formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      showAlert("success", "Login successful! Redirecting...");
      login(response.data.access_token);

      // Check if there's a redirect after login
      const redirectPath = sessionStorage.getItem("redirectAfterLogin");

      // Delay navigation to show success message
      setTimeout(() => {
        if (redirectPath === "/checkout") {
          const checkoutData = sessionStorage.getItem("checkoutData");
          const parsedCheckoutData = checkoutData
            ? JSON.parse(checkoutData)
            : {};

          sessionStorage.removeItem("redirectAfterLogin");
          sessionStorage.removeItem("checkoutData");

          navigate("/checkout", { state: parsedCheckoutData });
        } else if (redirectPath) {
          sessionStorage.removeItem("redirectAfterLogin");
          sessionStorage.removeItem("checkoutData");
          navigate(redirectPath);
        } else {
          navigate("/");
          window.location.reload(); 
        }
      }, 1000);
    } catch (error: any) {
      console.error("Login error:", error);

      // Handle different types of errors
      if (error.response?.status === 401) {
        showAlert("error", "Invalid email or password. Please try again.");
      } else if (error.response?.status === 422) {
        showAlert("error", "Please check your email format and try again.");
      } else if (error.code === "NETWORK_ERROR" || !error.response) {
        showAlert(
          "error",
          "Network error. Please check your connection and try again."
        );
      } else {
        showAlert(
          "error",
          "Incorrect email or password. Please verify your credentials or register for an account."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const AlertComponent = ({ alert }: { alert: Alert }) => {
    const alertStyles = {
      success: "bg-green-50 border-green-200 text-green-800",
      error: "bg-red-50 border-red-200 text-red-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
    };

    const iconStyles = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    };

    return (
      <div className={`p-4 mb-4 border rounded-lg ${alertStyles[alert.type]}`}>
        <div className="flex items-center">
          <span className="mr-2 font-bold">{iconStyles[alert.type]}</span>
          <span className="text-sm font-medium">{alert.message}</span>
          <button
            onClick={() => setAlert(null)}
            className="ml-auto text-lg font-bold hover:opacity-70"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 antialiased min-h-screen">
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto min-h-screen">
          <a
            href="#"
            className="flex items-center mb-6 text-2xl font-semibold text-gray-900"
          >
            <img className="w-20 h-20 mr-4" src="/logos.png" alt="logo" />
            FlowTech
          </a>
          <div className="w-full bg-white rounded-lg shadow sm:max-w-md xl:p-0">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                Sign in to your account
              </h1>
              {location.state?.message && (
                <div className="p-3 text-sm text-blue-800 bg-blue-100 rounded-lg dark:bg-blue-900 dark:text-blue-200">
                  {location.state.message}
                </div>
              )}
              {/* Alert Component */}
              {alert && <AlertComponent alert={alert} />}

              <form
                onSubmit={handleSubmit}
                className="space-y-4 md:space-y-6"
                action="#"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Your email
                  </label>
                  <input
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    name="email"
                    id="email"
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                    placeholder="name@company.com"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      value={formData.password}
                      onChange={handleChange}
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      placeholder="••••••••"
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 pr-10"
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-700 focus:outline-none"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="remember"
                        aria-describedby="remember"
                        type="checkbox"
                        className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="remember" className="text-gray-500">
                        Remember me
                      </label>
                    </div>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-gray-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-2 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ${
                    isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? "Logging in..." : "Login"}
                </button>
                <p className="text-sm font-light text-gray-500">
                  Don't have an account yet?{" "}
                  <Link
                    to="/register"
                    className="font-medium text-primary-600 hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Login;