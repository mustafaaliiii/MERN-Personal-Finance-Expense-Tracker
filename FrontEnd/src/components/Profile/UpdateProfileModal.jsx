import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import Input from '../../components/Inputs/Input';
import Textarea from '../../components/Inputs/Textarea';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { toast } from 'react-hot-toast';

const UpdateProfileModal = ({ isOpen, onClose, userProfile, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName || '',
        bio: userProfile.bio || '',
        gender: userProfile.gender || '',
        dob: userProfile.dob || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        country: userProfile.country || '',
        zip: userProfile.zip || '',
        profileImageUrl: userProfile.profileImageUrl || '',
      });
    }
  }, [userProfile, isOpen]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imgFormData = new FormData();
    imgFormData.append("image", file);

    setLoading(true);
    try {
      const response = await axiosInstance.post(API_PATHS.IMAGE.UPLOAD_IMAGE, imgFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData((prev) => ({ ...prev, profileImageUrl: response.data.imageUrl }));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload image.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Input component is smart enough to handle standard onChange but might swallow e.target if not careful.
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, formData);
      toast.success('Profile updated successfully!');
      onUpdateSuccess(response.data);
      onClose();
    } catch (error) {
      toast.error('Failed to update profile.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Profile">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="flex flex-col items-center mb-4">
          {formData.profileImageUrl ? (
            <img src={formData.profileImageUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-primary" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-2">
              <span className="text-slate-400 text-xs">Upload Image</span>
            </div>
          )}
          <label className="cursor-pointer text-sm text-primary hover:underline bg-primary/10 px-3 py-1 rounded">
            Change Picture
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={loading} />
          </label>
        </div>

        <Input label="Full Name" type="text" name="fullName" value={formData.fullName || ''} onChange={handleChange} required />
        <Textarea label="Bio" name="bio" value={formData.bio || ''} onChange={handleChange} rows={3} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Gender (e.g. Male/Female/Other)" type="text" name="gender" value={formData.gender || ''} onChange={handleChange} />
          <Input label="Date of Birth" type="date" name="dob" value={formData.dob || ''} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Phone" type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} />
          <Input label="Zip Code" type="text" name="zip" value={formData.zip || ''} onChange={handleChange} />
        </div>

        <Input label="Address" type="text" name="address" value={formData.address || ''} onChange={handleChange} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="City" type="text" name="city" value={formData.city || ''} onChange={handleChange} />
          <Input label="State" type="text" name="state" value={formData.state || ''} onChange={handleChange} />
        </div>
        <Input label="Country" type="text" name="country" value={formData.country || ''} onChange={handleChange} />

        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="btn-btn-light px-4 py-2 rounded text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary px-6 py-2 rounded text-white bg-primary hover:bg-primary-dark disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateProfileModal;
