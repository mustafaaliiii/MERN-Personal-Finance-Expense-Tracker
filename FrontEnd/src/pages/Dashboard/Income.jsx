import { useState, useEffect, useContext } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import IncomeOverview from "../../components/Income/IncomeOverview";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import Modal from "../../components/Modal";
import AddIncomeForm from "../../components/Income/AddIncomeForm";
import UploadIncomeCsvForm from "../../components/Income/UploadIncomeCsvForm";
import { toast } from "react-hot-toast";
import IncomeList from "../../components/Income/IncomeList";
import { UserContext } from "../../context/UserContext";
import ConfirmAlert from "../../components/ConfirmAlert";

const IncomePage = () => {
  const [incomeData, setIncomeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDeleteAlert, setOpenDeleteAlert] = useState({
    show: false,
    data: null,
  });
  const [openAddIncomeModal, setOpenAddIncomeModal] = useState(false);
  const [openCsvModal, setOpenCsvModal] = useState(false);

  // Get All Income Transactions
  const fetchIncomeTransactions = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await axiosInstance.get(API_PATHS.INCOME.GET_ALL_INCOME);
      if (response.data) {
        setIncomeData(response.data);
      }
    } catch (error) {
      console.error("Error fetching income transactions:", error);
      toast.error("Failed to load income.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Income
  const handleAddIncome = async (income) => {
    const { source, amount, date, icon } = income;

    if (!source.trim()) {
      toast.error("Source is required!");
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error("Amount must be a valid number greater than 0!");
      return;
    }
    if (!date) {
      toast.error("Date is required!");
      return;
    }

    try {
      await axiosInstance.post(API_PATHS.INCOME.ADD_INCOME, {
        source,
        amount: Number(amount),
        date,
        icon,
      });

      setOpenAddIncomeModal(false);
      toast.success("Income added successfully!");
      fetchIncomeTransactions();
    } catch (error) {
      console.error("Error adding income:", error);
      toast.error("Failed to add income.");
    }
  };

  // Handle Delete Income
  const deleteIncome = async (id) => {
    try {
      await axiosInstance.delete(API_PATHS.INCOME.DELETE_INCOME(id));
      setOpenDeleteAlert({ show: false, data: null });
      toast.success("Income deleted successfully!");
      fetchIncomeTransactions();
    } catch (error) {
      console.error("Error deleting income:", error);
      toast.error("Failed to delete income.");
    }
  };

  // Handle download income details
  const handleDownloadIncomeDetails = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.INCOME.DOWNLOAD_INCOME,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "income_details.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading income details:", error);
      toast.error("Failed to download income details.");
    }
  };

  useEffect(() => {
    fetchIncomeTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout activeMenu="Income">
      <div className="my-5 mx-auto text-slate-900 dark:text-slate-100">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <IncomeOverview
              transactions={incomeData}
              loading={loading}
              onAddIncome={() => setOpenAddIncomeModal(true)}
              onUploadCsv={() => setOpenCsvModal(true)}
            />
          </div>

          <IncomeList
            transactions={incomeData}
            loading={loading}
            onDelete={(id) => {
              setOpenDeleteAlert({
                show: true,
                data: id,
              });
            }}
            onDownload={handleDownloadIncomeDetails}
          />
        </div>

        {/* Upload CSV Modal */}
        <Modal
          isOpen={openCsvModal}
          onClose={() => setOpenCsvModal(false)}
          title="Upload Bank Statement (PDF/CSV/Excel)"
        >
          <UploadIncomeCsvForm 
            onSuccess={() => { setOpenCsvModal(false); fetchIncomeTransactions(); }}
            onCancel={() => setOpenCsvModal(false)}
          />
        </Modal>

        {/* Add Income */}
        <Modal
          isOpen={openAddIncomeModal}
          onClose={() => setOpenAddIncomeModal(false)}
          title="Add Income"
        >
          <AddIncomeForm onAddIncome={handleAddIncome} />
        </Modal>

        {/* Delete confirmation */}
        <Modal
          isOpen={openDeleteAlert.show}
          onClose={() => setOpenDeleteAlert({ show: false, data: null })}
          title="Delete Income"
        >
          <ConfirmAlert
            content="Are you sure you want to delete this income transaction?"
            onConfirm={() => {
              deleteIncome(openDeleteAlert.data);
            }}
            confirmContent="Delete"
            color="error"
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default IncomePage;
