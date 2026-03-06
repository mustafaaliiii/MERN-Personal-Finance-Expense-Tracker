import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../context/userContext";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";

const DashboardLayout = ({ children, activeMenu }) => {
  const { user } = useContext(UserContext);
  const [, setTick] = useState(0);

  useEffect(() => {
    const onRate = () => setTick((t) => t + 1);
    window.addEventListener("exchangeRateUpdated", onRate);
    return () => window.removeEventListener("exchangeRateUpdated", onRate);
  }, []);

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
