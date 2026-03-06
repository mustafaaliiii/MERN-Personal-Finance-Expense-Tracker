import { LuUtensils, LuTrash2 } from "react-icons/lu";
import { formatMoney } from "../../utils/currency";

const TransactionInfoCard = (props) => {
  const { title, icon, date, amount, type, hideDeleteBtn, onDelete } = props;

  const getAmountStyles = () => {
    return type === "income"
      ? "income-badge-visible"
      : "expense-badge-visible";
  };

  return (
    <div className="group relative flex items-center gap-4 mt-2 p-3 rounded-lg hover-theme-card transition-colors duration-300">
      {/* Icon container */}
      <div className="w-12 h-12 flex items-center justify-center text-xl text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-full">
        {icon ? (
          <img src={icon} alt={title} className="w-6 h-6" />
        ) : (
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
