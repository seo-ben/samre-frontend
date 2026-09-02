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

    // Synchronisation en arrière-plan avec l'API pour récupérer les droits à jour
    if (storedToken) {
      apiClient.get('/v1/auth/admin/me')
        .then(res => {
          if (res.data?.data) {
            setUser(res.data.data);
            localStorage.setItem('admin_user', JSON.stringify(res.data.data));
          }
        })
        .catch(() => {
          // Ignorer en cas de perte de réseau temporaire
        });
    }
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
      return freshUser;
    } catch {
      // Token invalide → déconnecter
      await logout();
    }
  }, [logout]);

  // ─── Vérification des droits d'action fins (view, create, edit, delete, export, suspend, validate) ───
  const can = useCallback((action, pagePath) => {
    if (!user) return false;
    const routes = user.allowed_routes;
    const actions = user.allowed_actions;

    // Super Admin intégral
    if (user.role === 'super_admin' || routes?.includes('*')) return true;

    // Si pas de routes définies pour un non-super_admin
    if (!routes || !Array.isArray(routes)) return false;

    const path = pagePath || (typeof window !== 'undefined' ? window.location.pathname : '');

    // Si la page n'est pas autorisée du tout
    const isRouteAllowed = routes.some(r => path === r || path.startsWith(r + '/'));
    if (!isRouteAllowed) return false;

    // Si les actions par page sont configurées
    if (actions && typeof actions === 'object' && !Array.isArray(actions)) {
      let pageActions = actions[path];
      if (!pageActions) {
        // Fallback sur le préfixe parent (ex: /offers/pending -> chercher /offers)
        const matchingKey = Object.keys(actions).find(k => path === k || path.startsWith(k + '/'));
        if (matchingKey) {
          pageActions = actions[matchingKey];
        }
      }

      if (Array.isArray(pageActions)) {
        return pageActions.includes(action);
      }

      // Par défaut, autoriser la lecture si la page est accordée
      return action === 'view';
    }

    return true;
  }, [user]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
    refreshUser,
    can,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ──────────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
};
