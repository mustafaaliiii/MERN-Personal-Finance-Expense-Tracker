import { useTheme } from "../context/ThemeContext";
import { LuSun, LuMoon } from "react-icons/lu";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border theme-card ${className}`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? <LuSun /> : <LuMoon />}
      <span className="text-sm">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
