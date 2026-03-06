// Theme-aware InfoCard with safe number formatting
// - value can be number or string
// - optional currency + showCurrency
// - keeps your colored circle accent

const InfoCard = ({
  icon,
  label,
  value,
  color = "bg-primary",
  currency = "PKR",
  showCurrency = true,
}) => {
  const formatted = (() => {
    if (typeof value === "number") {
      return new Intl.NumberFormat(undefined, {
        style: showCurrency ? "currency" : "decimal",
        currency,
        maximumFractionDigits: 0,
      }).format(value);
    }
    // string: avoid double "$"
    if (!showCurrency) return value;
    const hasSymbol = /^\s*[$€£₹]/.test(value);
    return hasSymbol
      ? value
      : new Intl.NumberFormat(undefined, {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(Number(value.replace(/[^\d.-]/g, "")) || 0);
  })();

  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center gap-6 p-6 rounded-2xl shadow-md border min-h-[88px]"
      style={{
        background: "var(--surface)",
        color: "var(--text)",
        borderColor: "var(--border)",
        boxShadow: "0 1px 2px rgba(0,0,0,.03)",
      }}
    >
      {/* colored circle accent (kept) */}
      <div
        className={`w-14 h-14 flex items-center justify-center text-[26px] text-white ${color} rounded-full drop-shadow-xl`}
        aria-hidden="true"
      >
        {icon}
      </div>

      <div>
        <h6 className="text-sm mb-1" style={{ color: "var(--muted)" }}>
          {label}
        </h6>
        <span className="text-[22px]" style={{ color: "var(--text)" }}>
          {formatted}
        </span>
      </div>
    </div>
  );
};

export default InfoCard;
