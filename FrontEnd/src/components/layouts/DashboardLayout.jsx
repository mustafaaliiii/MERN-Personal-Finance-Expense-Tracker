import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../context/UserContext";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";

const DashboardLayout = ({ children, activeMenu }) => {
  const { user, loading } = useContext(UserContext);
  const [, setTick] = useState(0);

  useEffect(() => {
    const onRate = () => setTick((t) => t + 1);
    window.addEventListener("exchangeRateUpdated", onRate);
    return () => window.removeEventListener("exchangeRateUpdated", onRate);
  }, []);

  // Show loading while user data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-lg text-gray-800 dark:text-gray-200">Loading...</div>
      </div>
    );
  }

  // If not loading but no user, the auth check should redirect, but just in case
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-lg text-gray-800 dark:text-gray-200">Please log in to access this page.</div>
      </div>
    );
  }

  return (
    <div className="theme-bg theme-text min-h-screen">
      <Navbar activeMenu={activeMenu} />

      {user && (
        <div className="flex">
          <div className="max-[1080px]:hidden">
            <SideMenu activeMenu={activeMenu} />
          </div>

          <div className="grow mx-5 my-5">{children}</div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
