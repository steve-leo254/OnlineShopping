import React from "react";
import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
import Bar from "../components/Bar";

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Bar />

      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
