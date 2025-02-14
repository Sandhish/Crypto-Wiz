import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const API_URL = `${import.meta.env.VITE_BACKEND_API}`;

  const authAxios = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  authAxios.interceptors.request.use((config) => {
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  });

  const handleAuthError = (error) => {
    if (error.response?.status === 401) {
      logout();
      navigate('/login');
    }
    return error;
  };

  const fetchWatchlist = async () => {
    try {
      if (!user?.token) {
        setWatchlist([]);
        setLoading(false);
        return;
      }

      const response = await authAxios.get('/api/watchlist');
      setWatchlist(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      handleAuthError(error);
      setWatchlist([]);
      setError(error.message);
      setLoading(false);
    }
  };

  const addToWatchlist = async (symbol) => {
    try {
      if (!user?.token) {
        navigate('/login');
        return false;
      }

      const response = await authAxios.post('/api/watchlist/add', { symbol });
      setWatchlist(response.data || []);
      return true;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      handleAuthError(error);
      setError(error.message);
      return false;
    }
  };

  const removeFromWatchlist = async (symbol) => {
    try {
      if (!user?.token) {
        navigate('/login');
        return false;
      }

      const response = await authAxios.delete(`/api/watchlist/remove/${symbol}`);
      setWatchlist(response.data || []);
      return true;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      handleAuthError(error);
      setError(error.message);
      return false;
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchWatchlist();
    } else {
      setWatchlist([]);
      setLoading(false);
    }
  }, [user?.token]);

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    fetchWatchlist
  };
};