import React from "react";
import { Link } from "react-router-dom";
import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ApiResponse {
  message: string;
  access_token?: string;
  user_id?: number;
}

interface Alert {
  type: "success" | "error" | "warning" | "info";
  message: string;
}

const Register: React.FC = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check against common disposable email providers
  const isDisposableEmail = (email: string): boolean => {
    const disposableDomains = [
      "tempmail.org",
      "10minutemail.com",
      "guerrillamail.com",
      "mailinator.com",
      "yopmail.com",
      "throwaway.email",
      "temp-mail.org",
      "sharklasers.com",
      "getairmail.com",
      "mailnesia.com",
      "maildrop.cc",
      "mailmetrash.com",
      "trashmail.com",
      "spam4.me",
      "bccto.me",
      "chacuo.net",
      "dispostable.com",
      "fakeinbox.com",
      "mailnull.com",
      "spamspot.com",
      "tempr.email",
      "tmpmail.org",
      "tmpeml.com",
      "tmpbox.net",
      "tmpmail.net",
    ];

    const domain = email.split("@")[1]?.toLowerCase();
    return disposableDomains.includes(domain);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`); // Debug log
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    // Basic email format validation
    if (!isValidEmail(formData.email)) {
      toast.error("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    // Check for disposable emails
    if (isDisposableEmail(formData.email)) {
      toast.error(
        "Disposable email addresses are not allowed. Please use a valid email address."
      );
      setIsSubmitting(false);
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    try {
      // Step 1: Register user (account will be inactive until email is verified)
      const apiUrl = `${API_BASE_URL}/auth/register/customer`;
      const response = await axios.post<ApiResponse>(
        apiUrl,
        {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Registration successful:", response.data);

      // Store user ID for verification
      if (response.data.user_id) {
        setPendingUserId(response.data.user_id);
      }

      // Show verification message
      setShowVerificationMessage(true);
      showAlert(
        "success",
        "Registration successful! Please check your email to verify your account."
      );
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail ||
          "Registration failed. Please try again."
        : "Registration failed. Please try again.";
      showAlert("error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to resend verification email
  const resendVerificationEmail = async () => {
    if (!pendingUserId) return;

    try {
      await axios.post(
        `${API_BASE_URL}/auth/resend-verification`,
        { user_id: pendingUserId },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      showAlert(
        "success",
        "Verification email sent again! Please check your inbox."
      );
    } catch (error) {
      showAlert(
        "error",
        "Failed to resend verification email. Please try again."
      );
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
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto min-h-screen lg:py-0">
          <a
            href="#"
            className="flex items-center mb-6 text-2xl font-semibold text-gray-900"
          >
            <img className="w-20 h-20 mr-2" src="/logos.png" alt="logo" />
            FlowTech
          </a>
          <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              {showVerificationMessage ? (
                // Email Verification Message
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 mb-2">
                    Check Your Email
                  </h1>
                  <p className="text-gray-600 mb-6">
                    We've sent a verification link to{" "}
                    <strong>{formData.email}</strong>
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      Please click the verification link in your email to
                      activate your account.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={resendVerificationEmail}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Resend Verification Email
                    </button>
                    <button
                      onClick={() => {
                        setShowVerificationMessage(false);
                        setFormData({
                          username: "",
                          email: "",
                          password: "",
                          confirmPassword: "",
                        });
                      }}
                      className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Back to Registration
                    </button>
                  </div>
                </div>
              ) : (
                // Registration Form
                <>
                  <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                    Create an account
                  </h1>
                  {/* Alert Component */}
                  {alert && <AlertComponent alert={alert} />}
                  <form onSubmit={handleSubmit} action="#">
                    <div className="max-h-[50vh] overflow-y-auto scrollbar-custom space-y-4 md:space-y-6">
                      <div>
                        <label
                          htmlFor="username"
                          className="block mb-2 text-sm font-medium text-gray-900"
                        >
                          Username
                        </label>
                        <input
                          value={formData.username}
                          onChange={handleChange}
                          type="text"
                          name="username"
                          id="username"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                          placeholder="Your username"
                          required
                        />
                      </div>
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
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
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
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 pr-10"
                            required
                            minLength={6}
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
                        <p className="text-xs text-gray-500 mt-1">
                          Password must be at least 6 characters long
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="confirm-password"
                          className="block mb-2 text-sm font-medium text-gray-900"
                        >
                          Confirm password
                        </label>
                        <div className="relative">
                          <input
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            id="confirm-password"
                            placeholder="••••••••"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 pr-10"
                            required
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() =>
                              setShowConfirmPassword((prev) => !prev)
                            }
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-700 focus:outline-none"
                            aria-label={
                              showConfirmPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="terms"
                            aria-describedby="terms"
                            type="checkbox"
                            name="terms"
                            className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300"
                            required
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="terms"
                            className="font-light text-gray-500"
                          >
                            I accept the{" "}
                            <a
                              className="font-medium text-primary-600 hover:underline"
                              href="/termsconditions"
                            >
                              Terms and Conditions
                            </a>
                          </label>
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`bg-gradient-to-r from-green-600 to-blue-600 w-full mt-4 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center ${
                        isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {isSubmitting
                        ? "Creating account..."
                        : "Create an account"}
                    </button>
                    <p className="mt-4 text-sm font-light text-gray-500">
                      Already have an account?{" "}
                      <Link
                        to="/login"
                        className="font-medium text-primary-600 hover:underline"
                      >
                        Login here
                      </Link>
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Register;