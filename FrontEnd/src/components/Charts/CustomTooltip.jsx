import { formatMoney, getCurrency } from "../../utils/currency";

const CustomTooltip = ({ active, payload, colors, data }) => {
  if (active && payload && payload.length) {
    const name = payload[0].name;
    const index = data.findIndex((d) => d.name === name);
    const color = colors[index % colors.length];
    const currency = getCurrency();

    return (
      <div
        className="rounded-md border shadow-sm"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text)",
          padding: "8px 10px",
        }}
      >
        <p className="text-xs font-semibold mb-1" style={{ color }}>
          {name}
        </p>
        <p className="text-sm">
          Amount:{" "}
          <span className="font-medium" style={{ color: "var(--text)" }}>
            {formatMoney(payload[0].value || 0, currency)}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
