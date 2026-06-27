import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/apiClient';

// ─── Contexte ─────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true); // true pendant la restauration initiale

  // ─── Restauration depuis localStorage au démarrage ─────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedUser  = localStorage.getItem('admin_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        // JSON corrompu → nettoyer
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }
    setLoading(false);
  }, []);

  // ─── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await apiClient.post('/v1/auth/admin/login', { email, password });

    const { token: newToken, user: newUser } = data.data;

    // Persister
    localStorage.setItem('admin_token', newToken);
    localStorage.setItem('admin_user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    return newUser;
  }, []);

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/v1/auth/admin/logout');
    } catch {
      // Ignorer les erreurs réseau lors du logout
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setToken(null);
      setUser(null);
    }
  }, []);

  // ─── Vérification du token actif ──────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/v1/auth/admin/me');
      const freshUser = data.data;
      setUser(freshUser);
      localStorage.setItem('admin_user', JSON.stringify(freshUser));
    } catch {
      // Token invalide → déconnecter
      await logout();
    }
  }, [logout]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ──────────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
};
