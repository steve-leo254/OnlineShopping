import type { MouseEvent } from 'react';

const useLogout = () => {
  // const navigate = useNavigate();

  const handleLogout = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");

    // Option 1: Hard reload (resets everything)
    window.location.href = "/login";

    // Option 2: Soft reload then redirect (less common in SPAs)
    // window.location.reload(); 
    // navigate("/login");

    // Note: Using `window.location.href = "/login"` bypasses React Router
    // and reloads the whole page — which is useful if you're trying to reset state entirely.
  };

  return { handleLogout };
};

export default useLogout;
