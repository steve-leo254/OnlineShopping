import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ApiResponse {
  message: string;
  detail?: string | Array<{ loc: string[]; msg: string }>;
}

const SuperAdminRegister: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    console.log("Form data being sent:", formData);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsSubmitting(false);
      return;
    }

    if (!formData.username.trim() || !formData.email.trim()) {
      setError("Username and email are required");
      setIsSubmitting(false);
      return;
    }

    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/auth/admin/create-admin`;
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

      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

      // Success case (axios throws for non-2xx status codes by default)
      console.log("Super Admin registration successful:", response.data);
      setSuccessMessage(response.data.message || "Super Admin account created successfully! You can now login.");
      
      // Clear form
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (error) {
      console.error("Super Admin registration error:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const responseData = error.response.data as ApiResponse;
          
          if (error.response.status === 400) {
            setError(responseData.detail || "Username or email already exists");
          } else if (error.response.status === 422) {
            // Validation error
            if (Array.isArray(responseData.detail)) {
              const errorMessages = responseData.detail.map((err) => 
                `${err.loc?.join('.')} - ${err.msg}`
              ).join(', ');
              setError(errorMessages);
            } else {
              setError(responseData.detail || "Validation error");
            }
          } else if (error.response.status >= 500) {
            setError("Server error. Please try again later.");
          } else {
            setError(responseData.detail || `HTTP error! status: ${error.response.status}`);
          }
        } else if (error.request) {
          // Network error
          setError("Cannot connect to server. Please make sure the API server is running on http://localhost:8000");
        } else {
          setError("Request failed. Please try again.");
        }
      } else {
        setError(error instanceof Error ? error.message : "Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-red-900 via-purple-900 to-indigo-800 antialiased min-h-screen">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto min-h-screen lg:py-0">
        <a
          href="#"
          className="flex items-center mb-6 text-2xl font-semibold text-white"
        >
          <div className="w-20 h-20 mr-2 bg-white rounded-lg flex items-center justify-center">
            <span className="text-red-600 font-bold text-xl">FT</span>
          </div>
          <span className="text-white">FlowTech</span>
        </a>
        
        <div className="w-full bg-white rounded-lg shadow-2xl md:mt-0 sm:max-w-md xl:p-0 border border-red-200">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <div className="text-center">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                Create Super Admin Account
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                This will create a system administrator account with full privileges
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="max-h-[50vh] overflow-y-auto space-y-4 md:space-y-6">
                <div>
                  <label
                    htmlFor="username"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={formData.username}
                    onChange={handleChange}
                    type="text"
                    name="username"
                    id="username"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-600 focus:border-red-600 block w-full p-2.5"
                    placeholder="Enter admin username"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    name="email"
                    id="email"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-600 focus:border-red-600 block w-full p-2.5"
                    placeholder="admin@flowtech.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={formData.password}
                    onChange={handleChange}
                    type="password"
                    name="password"
                    id="password"
                    placeholder="••••••••"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-600 focus:border-red-600 block w-full p-2.5"
                    required
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    type="password"
                    name="confirmPassword"
                    id="confirm-password"
                    placeholder="••••••••"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-600 focus:border-red-600 block w-full p-2.5"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <svg className="w-4 h-4 text-amber-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">
                        Important Security Notice
                      </p>
                      <p className="text-amber-700 mt-1">
                        Super Admin accounts have full system access. Only create this account if you are authorized to do so. This action should only be performed during initial system setup.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      aria-describedby="terms"
                      type="checkbox"
                      name="terms"
                      className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-red-300"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="terms"
                      className="font-light text-gray-500"
                    >
                      I understand the responsibilities and acknowledge that I have authorization to create a Super Admin account{" "}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 w-full mt-4 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-all duration-200 focus:ring-4 focus:outline-none focus:ring-red-300"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Super Admin...
                  </div>
                ) : (
                  "Create Super Admin Account"
                )}
              </button>

              <p className="mt-4 text-sm font-light text-gray-500 text-center">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-red-600 hover:underline"
                >
                  Login here
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuperAdminRegister;