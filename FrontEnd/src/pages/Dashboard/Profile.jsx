import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { toast } from "react-hot-toast";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import Input from "../../components/Inputs/Input";
import CharAvatar from "../../components/Cards/CharAvatar";
import Textarea from "../../components/Inputs/Textarea";
import SettingButton from "../../components/Profile/SettingButton";
import Modal from "../../components/Modal";
import ConfirmAlert from "../../components/ConfirmAlert";
import { LuPencil, LuTrash2, LuBan } from "react-icons/lu";

const Profile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clearAllTransactions, setClearAllTransactions] = useState(false);
  const [deleteAccount, setDeleteAccount] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const { clearUser } = useContext(UserContext);
  const navigate = useNavigate();

  const fetchUserProfile = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(API_PATHS.AUTH.GET_USER_INFO);
      if (response.data) setUserProfile(response.data);
    } catch (error) {
      toast.error("Failed to fetch user profile. Please try again.");
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };



  const handleEditToggle = () => {
    if (!isEditing) {
      setEditFormData({
        fullName: userProfile?.fullName || "",
        bio: userProfile?.bio || "",
        gender: userProfile?.gender || "",
        dob: userProfile?.dob || "",
        phone: userProfile?.phone || "",
        address: userProfile?.address || "",
        city: userProfile?.city || "",
        state: userProfile?.state || "",
        country: userProfile?.country || "",
        zip: userProfile?.zip || "",
        profileImageUrl: userProfile?.profileImageUrl || "",
      });
    }
    setIsEditing(!isEditing);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name) {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imgFormData = new FormData();
    imgFormData.append("image", file);

    setIsSaving(true);
    try {
      const response = await axiosInstance.post(API_PATHS.IMAGE.UPLOAD_IMAGE, imgFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEditFormData((prev) => ({ ...prev, profileImageUrl: response.data.imageUrl }));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload image.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, editFormData);
      setUserProfile(response.data);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAllTransactions = async () => {
    try {
      const income_response = await axiosInstance.delete(API_PATHS.INCOME.DELETE_ALL_INCOME);
      const expense_response = await axiosInstance.delete(API_PATHS.EXPENSE.DELETE_ALL_EXPENSE);
      if (income_response.status === 200 && expense_response.status === 200) {
        setClearAllTransactions(false);
        toast.success("All transactions cleared successfully!");
      }
    } catch (error) {
      console.error("Error clearing all transactions:", error);
      toast.error("Failed to clear transactions. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await axiosInstance.delete(API_PATHS.AUTH.DELETE_ACCOUNT);
      if (response.status === 200) {
        localStorage.removeItem("token");
        clearUser();
        navigate("/login");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please try again.");
      setDeleteAccount(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout activeMenu="Profile">
      <div className="my-5 mx-auto text-slate-900 dark:text-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile card */}
          <div className="card dark:bg-slate-800 dark:border-slate-700 flex items-center justify-between flex-col">
            <div className="flex items-start justify-between w-full mb-4">
              <div className="flex flex-col justify-center w-full">
                <h2 className="text-lg font-medium mb-1">User Profile</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">Let’s make it feel like you</p>
              </div>
              <div className="flex flex-row gap-1.5">
                {isEditing ? (
                  <>
                    <button onClick={handleEditToggle} className="btn-btn-light px-3 py-1 rounded text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">Cancel</button>
                    <button onClick={handleSaveProfile} disabled={isSaving} className="btn-primary px-3 py-1 rounded text-sm text-white bg-primary hover:bg-primary-dark">{isSaving ? 'Saving...' : 'Save'}</button>
                  </>
                ) : (
                  <SettingButton tooltip="Edit Profile" icon={<LuPencil size={18} />} onClick={handleEditToggle} />
                )}
                <SettingButton tooltip="Clear All Transactions" icon={<LuTrash2 size={18} />} onClick={() => setClearAllTransactions(true)} />
                <SettingButton tooltip="Delete Account" icon={<LuBan size={18} />} onClick={() => setDeleteAccount(true)} />
              </div>
            </div>

            <div className="flex flex-col items-center">
              {(isEditing ? editFormData.profileImageUrl : userProfile?.profileImageUrl) ? (
                <img
                  src={isEditing ? editFormData.profileImageUrl : userProfile?.profileImageUrl}
                  alt="Profile"
                  className="w-42 h-42 mb-2 bg-slate-400 rounded-full object-cover"
                />
              ) : (
                <div className="mb-2">
                  <CharAvatar
                    fullName={userProfile?.fullName}
                    width="w-42"
                    height="h-42"
                    style="text-6xl"
                  />
                </div>
              )}
              {isEditing && (
                <label className="cursor-pointer text-sm text-primary hover:underline bg-primary/10 px-3 py-1 rounded">
                  Change Picture
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isSaving} />
                </label>
              )}
            </div>

            <div className="w-full">
              <Textarea
                label="Bio"
                name="bio"
                value={isEditing ? editFormData.bio : (userProfile?.bio || "N/A")}
                onChange={handleChange}
                placeholder="Write something about yourself..."
                allowInput={isEditing}
                rows={8}
              />
            </div>
          </div>

          {/* Details */}
          <div className="card dark:bg-slate-800 dark:border-slate-700">
            <Input label="Fullname" type="text" name="fullName" value={isEditing ? editFormData.fullName : (userProfile?.fullName || "")} placeholder={userProfile?.fullName || ""} onChange={handleChange} allowInput={isEditing} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Gender" type="text" name="gender" value={isEditing ? editFormData.gender : (userProfile?.gender || "")} placeholder="Male/Female/Other" onChange={handleChange} allowInput={isEditing} />
              <Input label="Date of Birth" type="date" name="dob" value={isEditing ? editFormData.dob : (userProfile?.dob || "")} onChange={handleChange} allowInput={isEditing} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Email" type="email" value={userProfile?.email || "N/A"} allowInput={false} />
              <Input label="Phone" type="tel" name="phone" value={isEditing ? editFormData.phone : (userProfile?.phone || "")} placeholder="+1..." onChange={handleChange} allowInput={isEditing} />
            </div>
            <Input label="Address" type="text" name="address" value={isEditing ? editFormData.address : (userProfile?.address || "")} placeholder="Street address" onChange={handleChange} allowInput={isEditing} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="City" type="text" name="city" value={isEditing ? editFormData.city : (userProfile?.city || "")} placeholder="City" onChange={handleChange} allowInput={isEditing} />
              <Input label="State" type="text" name="state" value={isEditing ? editFormData.state : (userProfile?.state || "")} placeholder="State/Province" onChange={handleChange} allowInput={isEditing} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Country" type="text" name="country" value={isEditing ? editFormData.country : (userProfile?.country || "")} placeholder="Country" onChange={handleChange} allowInput={isEditing} />
              <Input label="Zip Code" type="text" name="zip" value={isEditing ? editFormData.zip : (userProfile?.zip || "")} placeholder="Zip Code" onChange={handleChange} allowInput={isEditing} />
            </div>

            <div className="mt-4">
              <h5 className="text-sm mb-2">Currency</h5>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  className="input-box w-40"
                  value="PKR (Pakistani Rupee)"
                  disabled
                />
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* Clear all */}
      <Modal
        isOpen={clearAllTransactions}
        onClose={() => setClearAllTransactions(false)}
        title="Clear All Transactions Data"
      >
        <ConfirmAlert
          content="Are you sure you want to delete all transactions data?"
          onConfirm={handleClearAllTransactions}
          confirmContent="Delete"
          color="error"
        />
      </Modal>

      {/* Delete account */}
      <Modal
        isOpen={deleteAccount}
        onClose={() => setDeleteAccount(false)}
        title="Delete Account"
      >
        <ConfirmAlert
          content="Are you sure you want to delete your account?"
          onConfirm={handleDeleteAccount}
          confirmContent="Delete"
          color="error"
        />
      </Modal>

    </DashboardLayout>
  );
};

export default Profile;
