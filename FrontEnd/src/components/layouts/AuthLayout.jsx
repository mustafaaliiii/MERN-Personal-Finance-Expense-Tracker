// src/components/layouts/AuthLayout.jsx
import CARD_2 from "../../assets/images/card2.png";
import { LuTrendingUpDown } from "react-icons/lu";
import ThemeToggle from "../ThemeToggle"; // <-- add the toggle

const AuthLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen theme-bg">
      {/* Left: form side */}
      <div className="w-screen md:w-[60vw] px-6 sm:px-12 pt-6 sm:pt-8 pb-12">
        {/* Header row with app title + theme toggle */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-strong)" }}>
            Expense Tracker
          </h2>
          <ThemeToggle />
        </div>

        {/* Auth content (Login / Signup forms) */}
        {children}
      </div>

      {/* Right: illustration side */}
      <div className="hidden md:block w-[40vw] h-screen bg-violet-50 dark:bg-[#0f172a] bg-auth-bg-img bg-cover bg-no-repeat bg-center overflow-hidden p-8 relative">
        {/* simple decorative blocks */}
        <div className="w-48 h-48 rounded-[40px] bg-purple-600 absolute -top-7 -left-5 opacity-80" />
        <div className="w-48 h-56 rounded-[40px] border-[20px] border-fuchsia-600 absolute top-[30%] -right-10 opacity-80" />
        <div className="w-48 h-48 rounded-[40px] bg-violet-500 absolute -bottom-7 -left-5 opacity-80" />

        {/* small stat card */}
        <div className="grid grid-cols-1 z-20">
          <StatsInfoCard
            icon={<LuTrendingUpDown />}
            label="Track Your Income & Expenses"
            value="430.000"
            color="bg-primary"
          />
        </div>

        <img
          src={CARD_2}
          alt="Card"
          className="w-64 lg:w-[90%] absolute bottom-10 shadow-lg rounded-2xl"
        />
      </div>
    </div>
  );
};

export default AuthLayout;

/* small info card used on the right panel */
const StatsInfoCard = ({ icon, label, value, color }) => {
  return (
    <div
      className="flex gap-6 p-4 rounded-xl shadow-md border z-10"
      style={{
        background: "var(--surface)",
        color: "var(--text)",
        borderColor: "var(--border)",
        boxShadow: "0 1px 2px rgba(0,0,0,.06)",
      }}
    >
      <div className={`w-12 h-12 flex items-center justify-center text-[26px] text-white ${color} rounded-full drop-shadow-xl`}>
        {icon}
      </div>
      <div>
        <h6 className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
          {label}
        </h6>
        <span className="text-[20px]" style={{ color: "var(--text-strong)" }}>
          ${value}
        </span>
      </div>
    </div>
  );
};
