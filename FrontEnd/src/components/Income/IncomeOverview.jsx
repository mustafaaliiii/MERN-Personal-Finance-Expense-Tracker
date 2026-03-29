import { useState, useEffect } from "react";
import { LuPlus, LuUpload } from "react-icons/lu";
import { prepareIncomeBarChartData } from "../../utils/helper";
import CustomBarChart from "../Charts/CustomBarChart";

const IncomeOverview = (props) => {
    const { transactions, onAddIncome, onUploadCsv } = props;
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const result = prepareIncomeBarChartData(transactions);
        setChartData(result);

        return () => { };

    }, [transactions]);

    return (
        <div className="card">
            <div className="flex items-center justify-between">
                <div className="">
                    <h5 className="text-lg">Income Overview</h5>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Track your earnings over time and analyze your income trends.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end">
                    <button className="add-btn bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800" onClick={onUploadCsv} title="Upload Bank Statement or CSV">
                        <LuUpload className="text-lg" />
                        <span className="hidden md:inline">Bank Statement</span>
                    </button>
                    <button className="add-btn" onClick={onAddIncome}>
                        <LuPlus className="text-lg" />
                        <span className="hidden lg:inline">Manual Income</span>
                    </button>
                </div>
            </div>

            <div className="mt-10">
                <CustomBarChart
                    data={chartData}
                    xAxisKey="date"
                    yAxisKey="amount"
                    title="Income Over Time"
                    color="#4CAF50"
                />
            </div>
        </div>
    )
}

export default IncomeOverview;