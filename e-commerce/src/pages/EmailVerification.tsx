import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState("");
  const toastShown = useRef(false);
  useEffect(() => {
    let isMounted = true;
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        if (isMounted) {
          setStatus("error");
          setMessage(
            "No verification token found. Please check your email for the correct verification link."
          );
          if (!toastShown.current) {
            toast.error("No verification token found.");
            toastShown.current = true;
          }
        }
        return;
      }

      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.post(
          `${API_BASE_URL}/auth/verify-email`,
          { token },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Verification response:", response.data);

        if (response.data.access_token) {
          login(response.data.access_token);
          if (isMounted) {
            setStatus("success");
            setMessage("Email verified successfully! Welcome to FlowTech!");
            if (!toastShown.current) {
              toast.success("Email verified! Welcome to FlowTech!");
              toastShown.current = true;
            }
            setTimeout(() => {
              navigate("/");
            }, 2000);
          }
        } else {
          if (isMounted) {
            setStatus("error");
            setMessage("Verification failed. Please try again.");
            if (!toastShown.current) {
              toast.error("Verification failed. Please try again.");
              toastShown.current = true;
            }
          }
        }
      } catch (error: any) {
        // Fallback: If already logged in, show success
        if (typeof window !== "undefined" && localStorage.getItem("token")) {
          setStatus("success");
          setMessage("Email verified successfully! Welcome to FlowTech!");
          if (!toastShown.current) {
            toast.success("Email verified! Welcome to FlowTech!");
            toastShown.current = true;
          }
          setTimeout(() => {
            navigate("/");
          }, 2000);
          return;
        }
        if (isMounted) {
          setStatus("error");
          setMessage(
            error.response?.data?.detail ||
              "Email verification failed. Please try again or contact support."
          );
          if (!toastShown.current) {
            toast.error(
              error.response?.data?.detail ||
                "Email verification failed. Please try again or contact support."
            );
            toastShown.current = true;
          }
        }
      }
    };

    verifyEmail();
    return () => {
      isMounted = false;
    };
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {status === "verifying" && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying Your Email
              </h1>
              <p className="text-gray-600">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === "success" && (
            <>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Email Verified!
              </h1>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">
                Redirecting you to the home page...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Failed
              </h1>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/register")}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Registering Again
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Go to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
