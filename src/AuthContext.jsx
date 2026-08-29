import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, getUser, setToken, setUser, logout as apiLogout, apiGetMe } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(getUser());
  const [loading, setLoading] = useState(true);

  const login = useCallback((token, userData) => {
    setToken(token);
    setUser(userData);
    setUserState(userData);
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUserState(null);
  }, []);

  const verifyToken = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const userData = await apiGetMe();
      setUser(userData);
      setUserState(userData);
    } catch {
      apiLogout();
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, verifyToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}