import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/me');
      setUser(response.data);
    } catch (err) {
      // User is not authenticated or backend is not running
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setError(null);
      const response = await api.post('/login', { username, password });
      setUser(response.data);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await api.post('/register', userData);
      setUser(response.data);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
      setUser(null);
    } catch {
      // Silent fail on logout
    }
  };

  const isAdmin = () => user?.role === 'admin';
  const isOwner = () => user?.role === 'owner' || user?.role === 'admin';
  const isTenant = () => user?.role === 'tenant';
  const isAuthenticated = () => !!user;

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    checkAuth,
    isAdmin,
    isOwner,
    isTenant,
    isAuthenticated,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
