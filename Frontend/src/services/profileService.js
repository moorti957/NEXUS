import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token found");
  }

   console.log("TOKEN:", token); // 👈 ADD THIS

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// ===============================
// PROFILE APIs
// ===============================

// Get Profile
export const getProfile = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/api/profile`,
    getAuthHeaders()
  );
  return response.data;
};

// Update Profile
export const updateProfile = async (profileData) => {
  const response = await axios.put(
    `${API_BASE_URL}/api/profile`,
    profileData,
    getAuthHeaders()
  );
  return response.data;
};

// ===============================
// AVATAR APIs
// ===============================

// Upload Avatar
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file);

  const token = localStorage.getItem("token");

  const response = await axios.post(
    `${API_BASE_URL}/api/profile/avatar`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

// Delete Avatar
export const deleteAvatar = async () => {
  const response = await axios.delete(
    `${API_BASE_URL}/api/profile/avatar`,
    getAuthHeaders()
  );
  return response.data;
};

// ===============================
// PASSWORD API
// ===============================

export const changePassword = async (passwordData) => {
  const response = await axios.put(
    `${API_BASE_URL}/api/profile/password`,
    passwordData,
    getAuthHeaders()
  );
  return response.data;
};

// ===============================
// ACTIVITY & STATS
// ===============================

// Get Activity
export const getActivity = async (page = 1, limit = 10) => {
  const response = await axios.get(
    `${API_BASE_URL}/api/profile/activity?page=${page}&limit=${limit}`,
    getAuthHeaders()
  );
  return response.data;
};

// Get Stats
export const getStats = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/api/profile/stats`,
    getAuthHeaders()
  );
  return response.data;
};

// ===============================
// DELETE ACCOUNT
// ===============================

export const deleteAccount = async (password, confirm) => {
  const response = await axios.delete(
    `${API_BASE_URL}/api/profile/delete`,
    {
      ...getAuthHeaders(),
      data: { password, confirm },
    }
  );
  return response.data;
};