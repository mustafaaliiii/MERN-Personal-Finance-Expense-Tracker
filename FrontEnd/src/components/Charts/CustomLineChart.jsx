import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney, getCurrency } from "../../utils/currency";
import { useEffect, useState } from "react";

const CustomLineChart = ({ data }) => {
  const [currency, setCurrency] = useState(getCurrency());

  // Listen for currency changes and theme changes
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrency(getCurrency());
    };

    const handleCurrencyUpdate = () => {
      setCurrency(getCurrency());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("exchangeRateUpdated", handleCurrencyUpdate);
    window.addEventListener("currencyChanged", handleCurrencyUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("exchangeRateUpdated", handleCurrencyUpdate);
      window.removeEventListener("currencyChanged", handleCurrencyUpdate);
    };
  }, []);

  const CustomToolTip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0]?.payload;
      return (
        <div
          style={{
            background: "var(--surface)",
            color: "var(--axis)",
            border: "1px solid var(--border)",
            boxShadow: "0 4px 10px rgba(0,0,0,.06)",
            borderRadius: 8,
            padding: 8,
          }}
        >
          <p style={{ fontSize: 12, color: "var(--axis-weak)", marginBottom: 4 }}>
            {p?.category ?? "forecast"}
          </p>
          <p style={{ fontSize: 14 }}>
            Amount:{" "}
            <span style={{ fontWeight: 700, color: "var(--axis)" }}>
              {formatMoney(p?.amount ?? 0, currency)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Format Y-axis tick values with currency
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
    <div className="chart-surface rounded-xl">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#875cf5" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#875cf5" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* grid lines adapt to theme */}
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.35} vertical={false} />

          {/* ✅ axis ticks now flip color with theme */}
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "var(--axis)" }}
            stroke="var(--border)"
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--axis)" }}
            stroke="var(--border)"
            width={36}
            tickFormatter={formatYAxis}
          />

          <Tooltip content={<CustomToolTip />} />

          <Area
            type="monotone"
            dataKey="amount"
            stroke="#875cf5"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#incomeGradient)"
            dot={{ r: 3, fill: "#ab8df8" }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomLineChart;
