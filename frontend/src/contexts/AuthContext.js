import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('[LOGIN] Attempt:', { email, password });
      const response = await axios.post('/api/login', { email, password });
      console.log('[LOGIN] Response:', response.data);
      // Accept both { access_token, user } and just { user }
      const { access_token, user: userData } = response.data;
      if (userData) {
        if (access_token) {
          localStorage.setItem('token', access_token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        } else {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      console.error('[LOGIN] No user in response:', response.data);
      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('[LOGIN] Error:', error, error.response?.data);
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 