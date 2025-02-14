import axios from 'axios';

const API_URL = `${import.meta.env.VITE_BACKEND_API}/api/auth`;

export const signup = async (formData) => {
  const response = await axios.post(`${API_URL}/signup`, formData);
  return response.data;
};

export const login = async (formData) => {
  const response = await axios.post(`${API_URL}/login`, formData);
  return response.data;
};

export const sendOTP = async (email) => {
  return await axios.post(`${API_URL}/forgot-password`, { email });
};

export const verifyOTP = async (email, otp) => {
  return await axios.post(`${API_URL}/verify-otp`, { email, otp });
};

export const updatePassword = async (email, otp, newPassword) => {
  return await axios.post(`${API_URL}/reset-password`, {
    email,
    otp,
    newPassword
  });
};