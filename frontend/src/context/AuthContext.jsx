import React, { createContext, useState, useEffect, useContext } from 'react';
import apiFetch from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('hiremind_token');
      const savedUser = localStorage.getItem('hiremind_user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Proactively verify token and load fresh user details
          const data = await apiFetch('/api/auth/me');
          setUser(data.user);
          localStorage.setItem('hiremind_user', JSON.stringify(data.user));
        } catch (err) {
          console.error('Session restoration failed:', err.message);
          // Token expired or invalid
          logout();
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (email, password, isGoogleLogin = false) => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, isGoogleLogin }),
      });
      
      localStorage.setItem('hiremind_token', data.token);
      localStorage.setItem('hiremind_user', JSON.stringify(data.user));
      setUser(data.user);
      setLoading(false);
      return data.user;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const register = async (name, email, password, role = 'CANDIDATE') => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });
      
      localStorage.setItem('hiremind_token', data.token);
      localStorage.setItem('hiremind_user', JSON.stringify(data.user));
      setUser(data.user);
      setLoading(false);
      return data.user;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('hiremind_token');
    localStorage.removeItem('hiremind_user');
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
