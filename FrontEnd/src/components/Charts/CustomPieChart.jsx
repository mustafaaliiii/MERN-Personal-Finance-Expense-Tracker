import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useEffect, useState } from "react";
import { formatMoney, getCurrency } from "../../utils/currency";
import CustomTooltip from "./CustomTooltip";
import CustomLegend from "./CustomLegend";

const CustomPieChart = ({ data, label, totalAmount, colors, showTextAnchor }) => {
  const [currency, setCurrency] = useState(getCurrency());

  // Listen for currency changes
  useEffect(() => {
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
  }, []);

  // Format the total amount with currency
  const formattedTotal = formatMoney(totalAmount || 0, currency);

  return (
    <ResponsiveContainer width="100%" height={380}>
      <PieChart
        // keep the chart background transparent so the card shows through
        style={{ background: "transparent" }}
      >
        <Pie
          data={data}
          dataKey="amount"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={130}
          innerRadius={100}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>

        {/* Dark/Light aware via CSS variables inside the components */}
        <Tooltip content={<CustomTooltip colors={colors} data={data} />} />
        <Legend content={<CustomLegend />} />

        {showTextAnchor && (
          <>
            <text
              x="50%"
              y="50%"
              dy={-25}
              textAnchor="middle"
              // use your defined tokens
              fill="var(--muted)"
              fontSize="14px"
            >
              {label}
            </text>
            <text
              x="50%"
              y="50%"
              dy={8}
              textAnchor="middle"
              fill="var(--text)"
              fontSize="24px"
              fontWeight="600"
            >
              {formattedTotal}
            </text>
          </>
        )}
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CustomPieChart;
