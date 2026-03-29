import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useEffect, useState } from "react";
import { formatMoney, getCurrency } from "../../utils/currency";

const CustomBarChart = ({ data }) => {
  const [colors, setColors] = useState({
    text: "#0f172a",
    muted: "#64748b",
    primary: "#875cf5",
  });
  const [currency, setCurrency] = useState(getCurrency());

  // Update when theme changes or currency changes
  useEffect(() => {
    const root = document.documentElement;
    setColors({
      text: getComputedStyle(root).getPropertyValue("--text").trim(),
      muted: getComputedStyle(root).getPropertyValue("--muted").trim(),
      primary: getComputedStyle(root).getPropertyValue("--primary").trim(),
    });

    const handleCurrencyChange = () => {
      setCurrency(getCurrency());
    };

    window.addEventListener("storage", handleCurrencyChange);
    window.addEventListener("exchangeRateUpdated", handleCurrencyChange);
    window.addEventListener("currencyChanged", handleCurrencyChange);

    return () => {
      window.removeEventListener("storage", handleCurrencyChange);
      window.removeEventListener("exchangeRateUpdated", handleCurrencyChange);
      window.removeEventListener("currencyChanged", handleCurrencyChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.documentElement.getAttribute("data-theme")]);

  const getBarColor = (index) => {
    // Alternate between purple and lighter purple
    return index % 2 === 0 ? colors.primary : "#cfbefb";
  };

  const CustomToolTip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="theme-card p-2 rounded-lg border">
          <p className="text-xs font-semibold mb-1" style={{ color: colors.primary }}>
            {payload[0].payload.date}
          </p>
          <p className="text-sm" style={{ color: colors.text }}>
            Amount:{" "}
            <span className="font-medium">
              {formatMoney(payload[0].payload.amount || 0, currency)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Format Y-axis tick values
  const formatYAxis = (value) => {
    if (value === 0) return "0";
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toFixed(0);
  };

  return (
    <div className="theme-card mt-6">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid stroke="none" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: colors.muted }}
            stroke="none"
          />
          <YAxis
            tick={{ fontSize: 12, fill: colors.muted }}
            stroke="none"
            tickFormatter={formatYAxis}
          />
          <Tooltip content={<CustomToolTip />} />
          <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={getBarColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomBarChart;
