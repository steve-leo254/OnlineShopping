import React from "react";
import { Link } from "react-router-dom";
import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ApiResponse {
  message: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

const Toast: React.FC<{ toast: Toast; onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div className={`flex items-center p-4 mb-4 border rounded-lg ${getBgColor()} ${getTextColor()} animate-in slide-in-from-right-5 duration-300`}>
      {getIcon()}
      <div className="ml-3 text-sm font-medium">{toast.message}</div>
      <button
        type="button"
        className={`ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 hover:bg-opacity-20 inline-flex h-8 w-8 ${getTextColor()}`}
        onClick={() => onRemove(toast.id)}
      >
        <span className="sr-only">Close</span>
        <XCircle className="w-3 h-3" />
      </button>
    </div>
  );
};

const Register: React.FC = () => {
  const API_BASE_URL = "https://api.example.com"; // Replace with your actual API URL
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean;
    isChecking: boolean;
    message: string;
  }>({
    isValid: false,
    isChecking: false,
    message: '',
  });

  const addToast = (message: string, type: 'success' | 'error' | 'warning') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if email exists (simulated - you might want to integrate with a real service)
  const checkEmailExists = async (email: string): Promise<boolean> => {
    if (!validateEmail(email)) return false;
    
    setEmailValidation(prev => ({ ...prev, isChecking: true }));
    
    try {
      // This is a simulation - replace with actual email verification service
      // For example, you could use a service like Hunter.io, ZeroBounce, or similar
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // For demo purposes, we'll accept common email providers
      const commonProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
      const domain = email.split('@')[1]?.toLowerCase();
      const isCommonProvider = commonProviders.includes(domain);
      
      setEmailValidation({
        isValid: isCommonProvider,
        isChecking: false,
        message: isCommonProvider 
          ? 'Email appears to be valid' 
          : 'Please use a valid email from a recognized provider'
      });
      
      return isCommonProvider;
    } catch (error) {
      setEmailValidation({
        isValid: false,
        isChecking: false,
        message: 'Could not verify email'
      });
      return false;
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate email on change
    if (name === 'email' && value) {
      const debounceTimer = setTimeout(() => {
        checkEmailExists(value);
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      addToast('Username is required', 'error');
      return false;
    }

    if (!formData.email.trim()) {
      addToast('Email is required', 'error');
      return false;
    }

    if (!validateEmail(formData.email)) {
      addToast('Please enter a valid email address', 'error');
      return false;
    }

    if (!emailValidation.isValid) {
      addToast('Please use a valid email from a recognized provider', 'error');
      return false;
    }

    if (!formData.password) {
      addToast('Password is required', 'error');
      return false;
    }

    if (formData.password.length < 8) {
      addToast('Password must be at least 8 characters long', 'error');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    console.log("Form data being sent:", formData);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
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
      addToast('Account created successfully! Redirecting to homepage...', 'success');
      
      // Redirect to homepage after successful registration
      setTimeout(() => {
        navigate("/"); // Change this to your homepage route
      }, 2000);
      
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.response?.data?.message || "Registration failed. Please try again."
        : "Registration failed. Please try again.";
      
      addToast(errorMessage, 'error');
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 w-full max-w-sm">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>

      <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 antialiased min-h-screen">
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto min-h-screen lg:py-0">
          <a
            href="#"
            className="flex items-center mb-6 text-2xl font-semibold text-white"
          >
            <img
              className="w-20 h-20 mr-2"
              src="/logos.png"
              alt="logo"
            />
            FlowTech
          </a>
          <div className="w-full bg-white rounded-lg shadow-2xl md:mt-0 sm:max-w-md xl:p-0">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                Create an account
              </h1>
              {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}
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
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors"
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
                    <div className="relative">
                      <input
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        name="email"
                        id="email"
                        className={`bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors ${
                          emailValidation.isChecking 
                            ? 'border-yellow-300' 
                            : emailValidation.isValid 
                              ? 'border-green-300' 
                              : formData.email 
                                ? 'border-red-300' 
                                : 'border-gray-300'
                        }`}
                        placeholder="name@company.com"
                        required
                      />
                      {emailValidation.isChecking && (
                        <div className="absolute right-3 top-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                    {emailValidation.message && (
                      <p className={`mt-1 text-xs ${emailValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                        {emailValidation.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block mb-2 text-sm font-medium text-gray-900"
                    >
                      Password
                    </label>
                    <input
                      value={formData.password}
                      onChange={handleChange}
                      type="password"
                      name="password"
                      id="password"
                      placeholder="••••••••"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors"
                      required
                    />
                    {formData.password && (
                      <p className={`mt-1 text-xs ${formData.password.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                        Password must be at least 8 characters long
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="block mb-2 text-sm font-medium text-gray-900"
                    >
                      Confirm password
                    </label>
                    <input
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      type="password"
                      name="confirmPassword"
                      id="confirm-password"
                      placeholder="••••••••"
                      className={`bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors ${
                        formData.confirmPassword 
                          ? formData.password === formData.confirmPassword 
                            ? 'border-green-300' 
                            : 'border-red-300'
                          : 'border-gray-300'
                      }`}
                      required
                    />
                    {formData.confirmPassword && (
                      <p className={`mt-1 text-xs ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                        {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="terms"
                        aria-describedby="terms"
                        type="checkbox"
                        name="terms"
                        className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
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
                          className="font-medium text-blue-600 hover:underline"
                          href="#"
                        >
                          Terms and Conditions
                        </a>
                      </label>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !emailValidation.isValid}
                  className="bg-gradient-to-r from-green-600 to-blue-600 w-full mt-4 text-white hover:from-green-700 hover:to-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Create an account'
                  )}
                </button>
                <p className="mt-4 text-sm font-light text-gray-500">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Login here
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

export default Register;