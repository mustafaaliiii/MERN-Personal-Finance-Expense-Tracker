import { useState, useEffect } from "react";
import { LuPlus, LuUpload, LuCamera } from "react-icons/lu";
import { prepareExpenseLineChartData } from "../../utils/helper";
import CustomLineChart from "../Charts/CustomLineChart";

const ExpenseOverview = (props) => {
    const { transactions, onAddExpense, onUploadCsv } = props;
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const result = prepareExpenseLineChartData(transactions);
        setChartData(result);

        return () => { };

    }, [transactions]);

    return (
        <div className="card">
            <div className="flex items-center justify-between">
                <div className="">
                    <h5 className="text-lg">Expense Overview</h5>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Track your spending trends over time and gain insights into where your money goes.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end">
                    <button className="add-btn bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" onClick={onAddExpense} title="Scan Receipt with OCR">
                        <LuCamera className="text-lg" />
                        <span className="hidden sm:inline">Scan Receipt (OCR)</span>
                    </button>
                    <button className="add-btn bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800" onClick={onUploadCsv} title="Upload Bank Statement or CSV">
                        <LuUpload className="text-lg" />
                        <span className="hidden md:inline">Bank Statement</span>
                    </button>
                    <button className="add-btn" onClick={onAddExpense}>
                        <LuPlus className="text-lg" />
                        <span className="hidden lg:inline">Manual Expense</span>
                    </button>
                </div>
            </div>

            <div className="mt-10">
                <CustomLineChart
                    data={chartData}
                />
            </div>
        </div>
    )
}

export default ExpenseOverview;