import { useState } from "react";
import { toast } from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const UploadCsvForm = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUploadAndParse = async () => {
    if (!file) return toast.error("Please select a file first");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await axiosInstance.post(API_PATHS.EXPENSE.PARSE_CSV, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data && res.data.length > 0) {
        setParsedData(res.data);
        setStep(2);
        toast.success(`Found ${res.data.length} transactions`);
      } else {
        toast.error("No valid transactions found in file");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to parse file");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (id, newCat) => {
    setParsedData(prev => prev.map(item => item.id === id ? { ...item, category: newCat } : item));
  };

  const handleSaveBulk = async () => {
    setLoading(true);
    try {
      await axiosInstance.post(API_PATHS.EXPENSE.BULK_ADD, { expenses: parsedData });
      toast.success("All expenses saved successfully!");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save expenses");
    } finally {
      setLoading(false);
    }
  };

  const removeRow = (id) => {
    setParsedData(prev => prev.filter(item => item.id !== id));
  };

  if (step === 1) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Upload your bank statement (<b>.pdf</b>, .csv, or .xlsx). The system will automatically extract the dates, amounts, and guess the categories using our smart engine!
        </p>
        <input 
          type="file" 
          accept=".csv,.xlsx,.pdf" 
          onChange={handleFileChange} 
          className="border border-slate-300 dark:border-slate-700 rounded-md p-2 text-sm w-full bg-transparent"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-md text-sm cursor-pointer" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="px-4 py-2 bg-primary text-white rounded-md text-sm cursor-pointer" onClick={handleUploadAndParse} disabled={loading || !file}>
            {loading ? "Parsing..." : "Next Step"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
        Review your transactions. Our engine has guessed the categories, but you can change them below before saving.
      </p>
      
      <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-md">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {parsedData.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{item.date}</td>
                <td className="px-4 py-3 max-w-xs truncate" title={item.description}>{item.description}</td>
                <td className="px-4 py-3 font-semibold">{item.amount}</td>
                <td className="px-4 py-3">
                  <select 
                    value={item.category} 
                    onChange={(e) => handleCategoryChange(item.id, e.target.value)}
                    className="border border-slate-300 dark:border-slate-600 rounded bg-transparent px-2 py-1 theme-text"
                  >
                    <option value="Food">Food</option>
                    <option value="Transport">Transport</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Bills">Bills</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Other">Other</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button className="text-red-500 hover:underline cursor-pointer" onClick={() => removeRow(item.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <button className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-md text-sm cursor-pointer" onClick={() => setStep(1)} disabled={loading}>Back</button>
        <button className="px-4 py-2 bg-primary text-white rounded-md text-sm cursor-pointer" onClick={handleSaveBulk} disabled={loading || parsedData.length === 0}>
          {loading ? "Saving..." : `Save ${parsedData.length} Expenses`}
        </button>
      </div>
    </div>
  );
};

export default UploadCsvForm;
