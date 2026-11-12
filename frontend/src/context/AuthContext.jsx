import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('smartattend_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('smartattend_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUserSession = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('smartattend_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error("Session verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUserSession();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: jwtToken, user: userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem('smartattend_token', jwtToken);
      localStorage.setItem('smartattend_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, error: res.data.error || 'Authentication failed.' };
  };

  const register = async (email, password, fullName, role = 'EMPLOYEE') => {
    const res = await api.post('/auth/register', { email, password, full_name: fullName, role });
    if (res.data.success) {
      const { token: jwtToken, user: userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem('smartattend_token', jwtToken);
      localStorage.setItem('smartattend_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, error: res.data.error || 'Registration failed.' };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('smartattend_token');
    localStorage.removeItem('smartattend_user');
  };

  const isAdmin = user?.role === 'ADMIN';
  const isSecurityOfficer = user?.role === 'SECURITY_OFFICER' || user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      isAdmin,
      isSecurityOfficer,
      isAuthenticated: !!token && !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
