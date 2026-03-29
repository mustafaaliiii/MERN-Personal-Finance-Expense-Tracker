import { LuUtensils, LuTrash2 } from "react-icons/lu";
import { formatMoney } from "../../utils/currency";

const TransactionInfoCard = (props) => {
  const { title, icon, date, amount, type, hideDeleteBtn, onDelete } = props;

  const getAmountStyles = () => {
    return type === "income"
      ? "income-badge-visible"
      : "expense-badge-visible";
  };

  // Helper function to check if a string is a valid emoji
  // Reject corrupted icons like "↑q"
  const isValidEmoji = (str) => {
    if (!str || typeof str !== "string") return false;
    
    // REJECT if contains ANY ASCII letters or numbers
    if (/[a-zA-Z0-9]/.test(str)) return false;
    
    // Must be 1-4 code units for emoji
    if (str.length > 4) return false;
    
    // Check for emoji in multiple ranges:
    // U+1F300–U+1F9FF (main emoji range)
    // U+1F000–U+1F02F (emoji symbols)
    // U+2600–U+26FF (Miscellaneous Symbols - includes lightning bolt ⚡)
    // U+2700–U+27BF (Dingbats)
    // U+1F600–U+1F64F (Emoticons)
    // U+2764 (Heart)
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{1F000}-\u{1F02F}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{2764}]/u;
    return emojiRegex.test(str);
  };

  return (
    <div className="group relative flex items-center gap-4 mt-2 p-3 rounded-lg hover-theme-card transition-colors duration-300">
      {/* Icon container */}
      <div className="w-12 h-12 flex items-center justify-center text-xl text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-full">
        {icon && typeof icon === "string" && icon.startsWith("http") ? (
          // Render image if icon is a valid URL
          <img src={icon} alt={title} className="w-6 h-6" />
        ) : icon && isValidEmoji(icon) ? (
          // Render emoji if it's valid
          <span>{icon}</span>
        ) : (
          // Fallback to default icon
          <LuUtensils />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-700 dark:text-gray-200 font-medium">
            {title}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {date}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!hideDeleteBtn && (
            <button
              className="text-gray-400 dark:text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={onDelete}
            >
              <LuTrash2 size={18} />
            </button>
          )}

          {/* Amount bubble */}
          <div className="flex items-center">
            <div className={`px-3 py-1.5 rounded-full ${getAmountStyles()}`}>
              <h6 className="text-sm font-semibold text-white">
                {type === "expense" ? "-" : "+"} {formatMoney(amount)}
              </h6>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionInfoCard;
