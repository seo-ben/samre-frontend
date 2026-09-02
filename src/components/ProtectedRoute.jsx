import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';

/**
 * Protège une route :
 * 1. Redirige vers le login si non authentifié.
 * 2. Bloque l'accès avec un écran d'alerte si le compte est suspendu.
 * 3. Vérifie que le collaborateur a le droit d'accéder à cette page (menu/sous-menu autorisé).
 */
const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();

  // Pendant la restauration du token depuis localStorage
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f7f9fb',
      }}>
        <svg
          style={{ animation: 'spin 1s linear infinite' }}
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0052ff"
          strokeWidth="2.5"
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Si le compte est suspendu
  if (user?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-200 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert size={34} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">Compte Administrateur Suspendu</h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Vos accès à l'espace d'administration SAMRE ont été temporairement suspendus. Veuillez contacter votre super-administrateur pour plus d'informations.
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
          >
            <LogOut size={16} />
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>
    );
  }

  // Vérification des droits d'accès à la page courante
  const routes = user?.allowed_routes;
  const hasExplicitRestrictions = Array.isArray(routes) && !routes.includes('*');

  // Pages toujours autorisées pour tout admin connecté (son profil et son mot de passe)
  const defaultAlwaysAllowed = ['/settings/profile', '/settings/password'];

  if (hasExplicitRestrictions && !defaultAlwaysAllowed.includes(location.pathname)) {
    const isCurrentPathAllowed = routes.some(route =>
      location.pathname === route || location.pathname.startsWith(route + '/')
    );

    if (!isCurrentPathAllowed) {
      // Rediriger vers la première page autorisée
      const fallbackRoute = routes[0] || '/settings/profile';
      return <Navigate to={fallbackRoute} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
