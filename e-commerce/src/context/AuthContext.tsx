import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  sub: string;
  id: number;
  role: string;
  exp: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  role: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [role, setRole] = useState<string | null>(null);

  // Decode token and check expiration
  useEffect(() => {
    if (token) {
      try {
        const decoded: JwtPayload = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          // Token is expired
          setToken(null);
          setRole(null);
          setIsAuthenticated(false);
          localStorage.removeItem("token");
          localStorage.removeItem("isLoggedIn");
        } else {
          setRole(decoded.role);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Invalid token:", err);
        setToken(null);
        setRole(null);
        setIsAuthenticated(false);
        localStorage.removeItem("token");
        localStorage.removeItem("isLoggedIn");
      }
    } else {
      setRole(null);
      setIsAuthenticated(false);
    }
  }, [token]);

  // Sync with localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem("token");
      setToken(newToken);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("isLoggedIn", "true");
    setToken(newToken);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, role, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
