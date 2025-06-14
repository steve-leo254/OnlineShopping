import type { MouseEvent } from 'react';

const useLogout = () => {
  // const navigate = useNavigate();

  const handleLogout = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");

    window.location.href = "/login";

    
  };

  return { handleLogout };
};

export default useLogout;
