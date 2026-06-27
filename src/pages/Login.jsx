import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Masquer le toast d'erreur après 4 secondes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 401) {
        setError('Email ou mot de passe incorrect.');
      } else if (status === 403) {
        setError(message ?? 'Compte suspendu. Contactez un super-administrateur.');
      } else if (!err.response) {
        setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
      } else {
        const errorMsg = message || 'Une erreur inattendue est survenue.';
        setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f7f9fb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
    }}>



      <main style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Logo + Brand */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        
          <h1 style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '26px', fontWeight: '700',
            color: '#191c1e', letterSpacing: '-0.01em', margin: '0 0 8px 0'
          }}>
            Portail Administration
          </h1>
          <p style={{ fontSize: '14px', color: '#434656', margin: 0 }}>
            Accédez à votre console de gestion sécurisée
          </p>
        </div>

        {/* Card */}
        <div style={{
          width: '100%',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>


            <div>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: '600',
                color: '#434656', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px'
              }}>
                Email Professionnel
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', lineHeight: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#737688" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/>
                  </svg>
                </span>
                <input
                  type="email"
                  required
                  placeholder="nom@entreprise.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px 12px 40px',
                    background: '#ffffff', border: '1px solid #c3c5d9',
                    borderRadius: '4px', fontSize: '14px', color: '#191c1e',
                    boxSizing: 'border-box', outline: 'none', transition: '0.2s',
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onFocus={e => { e.target.style.borderColor = '#0052ff'; e.target.style.boxShadow = '0 0 0 2px rgba(0,82,255,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#c3c5d9'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#434656', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Mot de passe
                </label>
                <a href="#" style={{ fontSize: '13px', color: '#003ec7', textDecoration: 'none', fontWeight: '500' }}>Oublié ?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', lineHeight: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#737688" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 44px 12px 40px',
                    background: '#ffffff', border: '1px solid #c3c5d9',
                    borderRadius: '4px', fontSize: '14px', color: '#191c1e',
                    boxSizing: 'border-box', outline: 'none', transition: '0.2s',
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onFocus={e => { e.target.style.borderColor = '#0052ff'; e.target.style.boxShadow = '0 0 0 2px rgba(0,82,255,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#c3c5d9'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#737688',
                    display: 'flex', alignItems: 'center', padding: 0, transition: '0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#191c1e'}
                  onMouseLeave={e => e.currentTarget.style.color = '#737688'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#003ec7', cursor: 'pointer' }}
              />
              <label htmlFor="remember" style={{ fontSize: '14px', color: '#434656', cursor: 'pointer', userSelect: 'none' }}>
                Maintenir la session active
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#737688' : '#0052ff',
                color: '#ffffff', border: 'none', borderRadius: '4px',
                fontSize: '16px', fontWeight: '600', fontFamily: "'Inter', sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                transition: '0.2s', boxShadow: loading ? 'none' : '0 1px 4px rgba(0,0,0,0.15)',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#003ec7'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0052ff'; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Authentification...
                </>
              ) : (
                <>
                  Se connecter
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* SSL */}
          <div style={{
            marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e0e3e5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: 0.7
          }}>
            <ShieldCheck size={16} color="#737688" />
            <span style={{ fontSize: '13px', color: '#434656' }}>Connexion SSL hautement sécurisée</span>
          </div>
        </div>

        {/* Help */}
        <p style={{ marginTop: '24px', fontSize: '14px', color: '#434656', textAlign: 'center' }}>
          Besoin d'aide ?{' '}
          <a href="#" style={{ color: '#003ec7', fontWeight: '600', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.textDecoration = 'underline'}
            onMouseLeave={e => e.target.style.textDecoration = 'none'}>
            Contacter le support IT
          </a>
        </p>
      </main>

      {/* Toast Error */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '16px 20px',
          background: '#ffffff',
          borderLeft: '4px solid #ef4444',
          borderRadius: '8px',
          color: '#1f2937',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 9999,
          maxWidth: '350px'
        }}>
          <div style={{ background: '#fef2f2', padding: '6px', borderRadius: '50%', display: 'flex', color: '#ef4444' }}>
            <AlertCircle size={20} />
          </div>
          <span>{typeof error === 'string' ? error : JSON.stringify(error)}</span>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes toastSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
        }
      `}</style>
    </div>
  );
};
